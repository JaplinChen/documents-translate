"""
Test script to debug ZIP-level slide duplication.
This script duplicates a slide and validates the resulting PPTX structure.
"""
import sys
import zipfile
import io
from xml.etree import ElementTree as ET

sys.path.insert(0, '/app')
from backend.services.pptx_apply_layout import duplicate_slide_zip_level


def validate_pptx_structure(pptx_bytes: bytes) -> list[str]:
    """Validate PPTX structure and return list of issues found."""
    issues = []
    
    with zipfile.ZipFile(io.BytesIO(pptx_bytes), 'r') as z:
        # Check Content_Types.xml
        ct_data = z.read('[Content_Types].xml')
        ct_tree = ET.fromstring(ct_data)
        
        # Find all slide overrides
        slide_overrides = []
        for override in ct_tree.findall('.//{http://schemas.openxmlformats.org/package/2006/content-types}Override'):
            pn = override.get('PartName', '')
            if '/ppt/slides/slide' in pn:
                slide_overrides.append(pn)
        
        # Find all actual slide files
        slide_files = [f'/{n}' for n in z.namelist() if n.startswith('ppt/slides/slide') and n.endswith('.xml')]
        
        # Check for mismatches
        for sf in slide_files:
            if sf not in slide_overrides:
                issues.append(f"Slide file {sf} not in [Content_Types].xml")
        
        for so in slide_overrides:
            if so not in slide_files:
                issues.append(f"Content type override {so} has no corresponding file")
        
        # Check presentation.xml
        pres_data = z.read('ppt/presentation.xml')
        pres_tree = ET.fromstring(pres_data)
        
        # Find sldIdLst
        ns_p = '{http://schemas.openxmlformats.org/presentationml/2006/main}'
        ns_r = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
        
        sld_id_lst = pres_tree.find(f'.//{ns_p}sldIdLst')
        if sld_id_lst is None:
            issues.append("No sldIdLst found in presentation.xml")
        else:
            sld_refs = []
            for sld_id in sld_id_lst.findall(f'{ns_p}sldId'):
                rid = sld_id.get(f'{ns_r}id')
                sid = sld_id.get('id')
                sld_refs.append((sid, rid))
                print(f"  sldId: id={sid}, r:id={rid}")
        
        # Check presentation.xml.rels
        pres_rels_data = z.read('ppt/_rels/presentation.xml.rels')
        pres_rels_tree = ET.fromstring(pres_rels_data)
        
        ns_rel = '{http://schemas.openxmlformats.org/package/2006/relationships}'
        
        slide_rels = {}
        for rel in pres_rels_tree.findall(f'{ns_rel}Relationship'):
            rid = rel.get('Id')
            target = rel.get('Target')
            rel_type = rel.get('Type')
            if 'slide' in rel_type:
                slide_rels[rid] = target
                print(f"  Relationship: Id={rid}, Target={target}")
        
        # Cross-check
        for sid, rid in sld_refs:
            if rid not in slide_rels:
                issues.append(f"sldId {sid} references {rid} which is not in presentation.xml.rels")
            else:
                target = slide_rels[rid]
                expected_file = f'ppt/{target}' if not target.startswith('/') else target[1:]
                if expected_file not in z.namelist():
                    issues.append(f"Relationship {rid} points to {target} which doesn't exist")
    
    return issues


if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print("Usage: python test_zip_dup.py <pptx_file> [slide_index]")
        sys.exit(1)
    
    pptx_path = sys.argv[1]
    slide_index = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    
    print(f"Duplicating slide {slide_index} from {pptx_path}...")
    
    result = duplicate_slide_zip_level(pptx_path, slide_index)
    
    print(f"\nResult size: {len(result)} bytes")
    print("\nValidating structure...")
    
    issues = validate_pptx_structure(result)
    
    if issues:
        print("\n❌ Issues found:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("\n✅ No structural issues found")
    
    # Save for manual inspection
    output_path = pptx_path.replace('.pptx', '_duplicated.pptx')
    with open(output_path, 'wb') as f:
        f.write(result)
    print(f"\nSaved to {output_path} for manual inspection")
