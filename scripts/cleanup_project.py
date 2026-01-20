import os
import shutil
import sys
from pathlib import Path

# Configuration
DRY_RUN = True  # Safety first
PROJECT_ROOT = Path(__file__).parent.parent.resolve()

# Targets to clean
CACHE_DIRS = [
    "__pycache__",
    ".pytest_cache",
    ".ruff_cache",
    ".mypy_cache",
    "build",
    "dist",
    ".git_corrupted_backup"
]

TEMP_FILES = [
    "*.log",
    "*.tmp",
    "*.bak",
    ".DS_Store",
    "backend_logs.txt",
    "inspect_output.txt",
    "overlap_debug*.txt",
    "shape_xml_debug.txt",
    "README.txt"
]

def confirm(prompt):
    while True:
        choice = input(f"{prompt} [y/N]: ").lower()
        if choice in ('y', 'yes'):
            return True
        if choice in ('n', 'no', ''):
            return False

def cleanup():
    print(f"Cleaning up project at: {PROJECT_ROOT}")
    if DRY_RUN:
        print(" [DRY RUN MODE] No files will be actually deleted.\n")

    files_to_remove = []
    dirs_to_remove = []

    # Scan for directories
    for root, dirs, files in os.walk(PROJECT_ROOT):
        # Skip .git, .venv, and node_modules to prevent accidents (and speed up)
        if ".git" in dirs:
            dirs.remove(".git")
        if ".venv" in dirs:
            dirs.remove(".venv")
        if "node_modules" in dirs:
            dirs.remove("node_modules")
            
        for d in dirs:
            if d in CACHE_DIRS:
                dirs_to_remove.append(Path(root) / d)
        
        # Check files
        for f in files:
            p = Path(root) / f
            # Exact match check
            if f in TEMP_FILES:
                 files_to_remove.append(p)
                 continue
            
            # Pattern match check
            from fnmatch import fnmatch
            for pattern in TEMP_FILES:
                if fnmatch(f, pattern):
                    files_to_remove.append(p)
                    break

    # Summary
    print(f"Found {len(dirs_to_remove)} directories and {len(files_to_remove)} files to clean.")
    
    if not dirs_to_remove and not files_to_remove:
        print("Nothing to clean. All good!")
        return

    # List items
    if dirs_to_remove:
        print("\nDirectories to remove:")
        for d in dirs_to_remove:
            print(f"  [DIR]  {d.relative_to(PROJECT_ROOT)}")

    if files_to_remove:
        print("\nFiles to remove:")
        for f in files_to_remove:
            print(f"  [FILE] {f.relative_to(PROJECT_ROOT)}")

    print("-" * 40)
    
    if DRY_RUN:
        print("\nTo execute, run this script with --force or set DRY_RUN=False in code.")
        print("Or I can prompt you now if you want to proceed despite dry run flag?")
        if not confirm("Proceed with DELETION?"):
            print("Aborted.")
            return

    # Execution
    print("\nDeleting...")
    for d in dirs_to_remove:
        try:
            if d.exists():
                shutil.rmtree(d)
                print(f"Deleted: {d.name}")
        except Exception as e:
            print(f"Error deleting {d}: {e}")

    for f in files_to_remove:
        try:
            if f.exists():
                os.remove(f)
                print(f"Deleted: {f.name}")
        except Exception as e:
            print(f"Error deleting {f}: {e}")

    print("\nCleanup Complete.")

if __name__ == "__main__":
    if "--force" in sys.argv:
        DRY_RUN = False
    cleanup()
