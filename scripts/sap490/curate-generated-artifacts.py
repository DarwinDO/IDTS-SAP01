"""Remove archived SAP490 binaries from the current tree after safety checks."""

from __future__ import annotations

import importlib.util
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
GENERATED = (ROOT / "docs/sap490/generated").resolve()
MANIFEST_GENERATOR = Path(__file__).with_name("generate-generated-archive-manifest.py")


def load_current_names() -> set[str]:
    spec = importlib.util.spec_from_file_location("archive_manifest", MANIFEST_GENERATOR)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load archive manifest generator")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return set(module.CURRENT)


def main() -> None:
    current = load_current_names()
    missing = sorted(name for name in current if not (GENERATED / name).is_file())
    if missing:
        raise SystemExit("Refusing cleanup; current artifacts are missing: " + ", ".join(missing))

    targets = sorted(
        path for path in GENERATED.iterdir()
        if path.is_file() and path.suffix.lower() in {".xlsx", ".docx"} and path.name not in current
    )
    for path in targets:
        if path.parent.resolve() != GENERATED:
            raise SystemExit(f"Unsafe cleanup target: {path}")

    total = sum(path.stat().st_size for path in targets)
    print(f"VERIFIED_TARGETS={len(targets)}")
    print(f"VERIFIED_BYTES={total}")
    for path in targets:
        print(path.relative_to(ROOT))
        path.unlink()
    print(f"REMAINING={sum(1 for path in GENERATED.iterdir() if path.suffix.lower() in {'.xlsx', '.docx'})}")


if __name__ == "__main__":
    main()
