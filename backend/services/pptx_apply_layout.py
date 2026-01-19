from __future__ import annotations

import io
from copy import deepcopy
from typing import Any

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE_TYPE
from pptx.enum.text import MSO_AUTO_SIZE
from pptx.slide import Slide
from pptx.text.text import TextFrame

from backend.services.pptx_apply_text import apply_font_spec


def add_overflow_textboxes(
    slide: Slide,
    base_shape,
    chunks: list[str],
    font_spec: dict[str, Any] | None,
    translated_color: RGBColor,
    max_bottom: int,
) -> None:
    if not chunks:
        return
    top = base_shape.top
    height = base_shape.height
    margin = int(height * 0.1)
    for index, chunk in enumerate(chunks):
        next_top = top + height + margin + index * (height + margin)
        if next_top + height > max_bottom:
            break
        box = slide.shapes.add_textbox(base_shape.left, next_top, base_shape.width, height)
        text_frame = box.text_frame
        text_frame.auto_size = MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE
        text_frame.clear()
        for line_index, line in enumerate(chunk.split("\n")):
            paragraph = text_frame.paragraphs[0] if line_index == 0 else text_frame.add_paragraph()
            paragraph.text = line
            if paragraph.runs:
                apply_font_spec(paragraph.runs[0], font_spec or {}, translated_color, scale=0.9)


def duplicate_slide(presentation: Presentation, slide: Slide) -> tuple[Slide, dict[int, int]]:
    """
    Duplicate a slide with full fidelity including images and shapes.
    
    Uses a hybrid approach:
    - Pictures are re-added using add_picture() with extracted blob data
    - Other shapes are XML-copied with ID regeneration
    
    Returns:
        tuple: (new_slide, shape_id_map) where shape_id_map maps old shape IDs to new shape IDs.
    """
    try:
        import random
        
        print(f"[HYBRID_DUP] Starting duplicate_slide for slide with {len(slide.shapes)} shapes", flush=True)
        
        # 1. Create a new slide based on the same layout
        new_slide = presentation.slides.add_slide(slide.slide_layout)
        
        # Clear any default layout shapes (we'll copy everything from source)
        for shape in list(new_slide.shapes):
            try:
                el = shape.element
                el.getparent().remove(el)
            except Exception:
                pass
        
        shape_id_map = {}
        base_id = random.randint(10000, 99999999)
        id_counter = 0
        
        # Namespaces
        p_ns = '{http://schemas.openxmlformats.org/presentationml/2006/main}'
        a_ns = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
        r_ns = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
        
        # 2. Copy relationships (excluding layout and master)
        rid_mapping = {}
        for rel in slide.part.rels.values():
            if rel.reltype in (
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout",
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide",
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/master"
            ):
                continue
            
            old_rid = rel.rId
            try:
                if rel.is_external:
                    new_rid = new_slide.part.relate_to(rel.target_ref, rel.reltype, is_external=True)
                else:
                    new_rid = new_slide.part.relate_to(rel.target_part, rel.reltype)
                
                rid_mapping[old_rid] = new_rid
                print(f"[XML_DUP] Mapping rId: {old_rid} -> {new_rid} ({rel.reltype})", flush=True)
            except Exception as e:
                print(f"[XML_DUP] Failed to copy relationship {old_rid}: {e}", flush=True)
        
        # 3. Process each shape
        sp_tree = new_slide.shapes._spTree
        ext_lst = sp_tree.find(f"{p_ns}extLst")
        
        for shape in slide.shapes:
            try:
                old_id = shape.shape_id
                
                # Use unified XML deep copy for ALL shapes (including Pictures)
                new_element = deepcopy(shape.element)
                
                # Pass 1: Regenerate all shape IDs
                for elem in new_element.iter():
                    if elem.tag.endswith('}cNvPr'):
                        try:
                            current_id = elem.get('id')
                            if current_id:
                                old_sid = int(current_id)
                                new_id = base_id + id_counter
                                id_counter += 1
                                elem.set('id', str(new_id))
                                shape_id_map[old_sid] = new_id
                        except ValueError:
                            pass
                
                # Pass 2: Fix references (Connectors and Relationships)
                for elem in new_element.iter():
                    # Fix connector references
                    if elem.tag in (f"{a_ns}stCxn", f"{a_ns}endCxn"):
                        ref_id = elem.get('id')
                        if ref_id and ref_id.isdigit():
                            rid_int = int(ref_id)
                            if rid_int in shape_id_map:
                                elem.set('id', str(shape_id_map[rid_int]))
                    
                    # Fix relationship references (r:id, r:embed, r:link, etc.)
                    for attr_name, attr_val in list(elem.attrib.items()):
                        # Check if attribute is in the relationship namespace
                        if 'http://schemas.openxmlformats.org/officeDocument/2006/relationships' in attr_name:
                            if attr_val in rid_mapping:
                                old_val = attr_val
                                new_val = rid_mapping[old_val]
                                elem.attrib[attr_name] = new_val
                                print(f"[XML_DUP] Remapped {attr_name}: {old_val} -> {new_val}", flush=True)
                
                # Insert into shape tree
                if ext_lst is not None:
                    ext_lst.addprevious(new_element)
                else:
                    sp_tree.append(new_element)
                    
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Failed to copy shape {shape.shape_id}: {e}")
                continue
        
        print(f"[HYBRID_DUP] Completed. Shape map has {len(shape_id_map)} entries", flush=True)
        return new_slide, shape_id_map

    except Exception as exc:
        import logging
        logging.getLogger(__name__).error(f"Duplicate slide failed: {exc}")
        return presentation.slides.add_slide(presentation.slide_layouts[6]), {}


def insert_slide_after(presentation: Presentation, new_slide: Slide, after_index: int) -> None:
    sld_id_list = presentation.slides._sldIdLst
    new_sld_id = sld_id_list[-1]
    sld_id_list.remove(new_sld_id)
    sld_id_list.insert(after_index + 1, new_sld_id)


def _iter_shapes(shapes):
    for shape in shapes:
        yield shape
        try:
            if shape.shape_type == MSO_SHAPE_TYPE.GROUP:
                yield from _iter_shapes(shape.shapes)
        except Exception:
            continue


def find_shape_in_shapes(shapes, shape_id: int):
    for shape in _iter_shapes(shapes):
        if shape.shape_id == shape_id:
            return shape
    return None


def find_shape_with_id(slide: Slide, shape_id: int):
    return find_shape_in_shapes(slide.shapes, shape_id)


def iter_table_cells(shape) -> list[TextFrame]:
    cells = []
    for row in shape.table.rows:
        for cell in row.cells:
            cells.append(cell.text_frame)
    return cells
