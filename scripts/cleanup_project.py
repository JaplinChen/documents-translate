import os
import shutil
import argparse

def cleanup():
    parser = argparse.ArgumentParser(description="PPTX-Translate Project Cleanup Script")
    parser.add_argument("--dry-run", action="store_true", help="List files to be deleted without actual removal")
    parser.add_argument("--force", action="store_true", help="Skip confirmation before deletion")
    args = parser.parse_args()

    # Targets to delete (folders and files)
    FOLDERS_TO_CLEAN = [
        "__pycache__",
        ".pytest_cache",
        ".mypy_cache",
        "build",
        "dist",
    ]
    
    FILES_TO_CLEAN = [
        "backend_logs.txt",
        "overlap_recursive.txt",
    ]
    
    FILE_EXTENSIONS_TO_CLEAN = [
        ".log",
        ".tmp",
        ".bak",
        ".DS_Store",
    ]

    # Orphaned scripts identified in audit
    ORPHANED_SCRIPTS = [
        "check_env.py",
        "inspect_debug.py",
        "verify_refresh.py",
        "verify_translategemma.py",
        "程式碼審查報告.md",
    ]

    to_delete_folders = []
    to_delete_files = []

    # Scan for folders
    for root, dirs, files in os.walk("."):
        # Exclude node_modules and .venv
        if "node_modules" in dirs:
            dirs.remove("node_modules")
        if ".venv" in dirs:
            dirs.remove(".venv")
            
        for d in dirs:
            if d in FOLDERS_TO_CLEAN:
                to_delete_folders.append(os.path.abspath(os.path.join(root, d)))
        
        for f in files:
            path = os.path.abspath(os.path.join(root, f))
            # Check specific files
            if f in FILES_TO_CLEAN:
                to_delete_files.append(path)
            # Check extensions
            elif any(f.endswith(ext) for ext in FILE_EXTENSIONS_TO_CLEAN):
                to_delete_files.append(path)
            # Check orphaned scripts in root
            elif root == "." and f in ORPHANED_SCRIPTS:
                to_delete_files.append(path)

    if not to_delete_folders and not to_delete_files:
        print("No cleanup targets found.")
        return

    print("=== Cleanup Targets ===")
    for folder in to_delete_folders:
        print(f"[FOLDER] {folder}")
    for file in to_delete_files:
        print(f"[FILE]   {file}")
    print("========================")

    if args.dry_run:
        print("\nDry-run mode enabled. No files were deleted.")
        return

    if not args.force:
        confirm = input(f"\nFound {len(to_delete_folders)} folders and {len(to_delete_files)} files. Proceed with deletion? (y/N): ")
        if confirm.lower() != 'y':
            print("Cleanup cancelled.")
            return

    # Execution
    for folder in to_delete_folders:
        try:
            shutil.rmtree(folder)
            print(f"Deleted folder: {folder}")
        except Exception as e:
            print(f"Error deleting folder {folder}: {e}")

    for file in to_delete_files:
        try:
            os.remove(file)
            print(f"Deleted file: {file}")
        except Exception as e:
            print(f"Error deleting file {file}: {e}")

    print("\nCleanup completed.")

if __name__ == "__main__":
    cleanup()
