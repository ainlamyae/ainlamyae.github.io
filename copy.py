import os
import shutil
import json

SRC = r"C:\Users\AinLamYae\Documents\GitHub\resume"
DST = r"C:\Users\AinLamYae\Documents\GitHub\ainlamyae.github.io"


def copy_resume():
    for root, dirs, files in os.walk(SRC):

        # Skip .git folders
        dirs[:] = [d for d in dirs if d != ".git"]

        # Special rule for assets/media
        if "assets\\media" in root.lower():
            dirs[:] = [d for d in dirs if d.lower() == "logo"]

        rel = os.path.relpath(root, SRC)
        dest_root = os.path.join(DST, rel)

        os.makedirs(dest_root, exist_ok=True)

        for file in files:
            if file.startswith(".git"):
                continue

            src_file = os.path.join(root, file)
            dst_file = os.path.join(dest_root, file)

            shutil.copy2(src_file, dst_file)


def replace_file_with_null(json_path):
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    def recurse(obj):
        if isinstance(obj, dict):
            for k in list(obj.keys()):
                if k == "file":
                    obj[k] = None
                else:
                    recurse(obj[k])
        elif isinstance(obj, list):
            for item in obj:
                recurse(item)

    recurse(data)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def remove_media_fields(json_path):
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    def recurse(obj):
        if isinstance(obj, dict):
            if "media" in obj:
                del obj["media"]
            for v in obj.values():
                recurse(v)
        elif isinstance(obj, list):
            for item in obj:
                recurse(item)

    recurse(data)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def process_json_files():
    data_dir = os.path.join(DST, "assets", "data")

    awards = os.path.join(data_dir, "awards.json")
    certs = os.path.join(data_dir, "certifications.json")
    exp = os.path.join(data_dir, "experience.json")

    if os.path.exists(awards):
        replace_file_with_null(awards)

    if os.path.exists(certs):
        replace_file_with_null(certs)

    if os.path.exists(exp):
        remove_media_fields(exp)


if __name__ == "__main__":
    copy_resume()
    process_json_files()
    print("Copy and JSON cleanup completed.")