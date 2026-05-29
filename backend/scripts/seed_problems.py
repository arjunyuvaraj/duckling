from __future__ import annotations

import pathlib
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.services.problem_seed import seed_problem_catalog  # noqa: E402


if __name__ == "__main__":
    count = seed_problem_catalog()
    print(f"Seeded {count} Duckling problems.")
