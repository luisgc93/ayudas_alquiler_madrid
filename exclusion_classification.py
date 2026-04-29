"""
Exclusion reason breakdown: Spanish vs foreign applicants.

Visualization note: a grouped bar chart works here, but a Cleveland dot plot
(one row per motivo, two dots per row connected by a line) would be less
cluttered for 19 categories and make the gap between groups easier to read.
This script produces the bar chart; swap the plotting section for the dot
plot if preferred.

Each applicant can have multiple motivos ("|"-separated), so counts are
computed per (motivo, group) and normalised by group size to get rates —
raw counts would be misleading because the two groups have different sizes.
"""

from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np
import pandas as pd


CSV_PATH = Path("excluidos_por_nacionalidades.csv")
OUT_PATH = Path("exclusion_reasons_by_origin.png")

# Natural sort key for codes like "1.1", "4.6", "10", "11"
def _sort_key(code: str) -> tuple:
    return tuple(int(p) for p in code.split("."))


def load_rates(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)

    group_sizes = df["español"].value_counts()  # True / False

    # One row per (applicant, motivo)
    exploded = (
        df[["español", "motivos"]]
        .dropna(subset=["motivos"])
        .assign(motivo=lambda d: d["motivos"].str.split(r"\s*\|\s*"))
        .explode("motivo")
        .assign(motivo=lambda d: d["motivo"].str.strip())
    )

    # Count applicants per (motivo, group) — each applicant counted once per motivo
    counts = (
        exploded.groupby(["motivo", "español"])
        .size()
        .reset_index(name="count")
    )

    counts["rate"] = counts.apply(
        lambda r: r["count"] / group_sizes[r["español"]] * 100, axis=1
    )

    # Pivot: index=motivo, columns=español (True/False)
    rates = counts.pivot(index="motivo", columns="español", values="rate").fillna(0)
    rates.columns = ["Extranjero", "Español"]

    # Sort codes numerically
    rates = rates.loc[sorted(rates.index, key=_sort_key)]

    return rates


def plot(rates: pd.DataFrame, out_path: Path) -> None:
    motivos = rates.index.tolist()
    n = len(motivos)
    x = np.arange(n)
    width = 0.38

    fig, ax = plt.subplots(figsize=(14, 6))

    ax.bar(x - width / 2, rates["Español"],    width, label="Español",    color="#2196F3", alpha=0.85)
    ax.bar(x + width / 2, rates["Extranjero"], width, label="Extranjero", color="#FF5722", alpha=0.85)

    ax.set_xlabel("Motivo de exclusión", fontsize=11)
    ax.set_ylabel("% de solicitantes del grupo", fontsize=11)
    ax.set_title(
        "Motivos de exclusión: solicitantes españoles vs extranjeros\n"
        "(Programa Jóvenes CAM 2024 — % sobre total de cada grupo)",
        fontsize=12,
    )
    ax.set_xticks(x)
    ax.set_xticklabels(motivos, rotation=45, ha="right")
    ax.yaxis.set_major_formatter(mticker.PercentFormatter(decimals=0))
    ax.legend()
    ax.grid(axis="y", linestyle="--", alpha=0.4)

    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    print(f"Saved: {out_path}")


def main() -> None:
    rates = load_rates(CSV_PATH)
    print(rates.to_string())
    plot(rates, OUT_PATH)


if __name__ == "__main__":
    main()
