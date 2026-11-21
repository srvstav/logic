"""Build the atlas's induced FAFB v783 subgraph from the two credited gzip CSVs."""

import argparse
from collections import Counter
import csv
import gzip
import json
from pathlib import Path


CENTER = "720575940610901930"
PARTNERS_PER_SIDE = 6


def records(path):
    with gzip.open(path, "rt", encoding="utf-8", newline="") as source:
        yield from csv.DictReader(source)


def strongest(weights, excluded=()):
    ordered = sorted(weights, key=lambda cell: (-weights[cell], cell))
    return [cell for cell in ordered if cell not in excluded][:PARTNERS_PER_SIDE]


def extract(connections, types):
    incoming = Counter()
    outgoing = Counter()
    for row in records(connections):
        pre, post = row["pre_root_id"], row["post_root_id"]
        if pre == CENTER and pre != post:
            outgoing[post] += int(row["syn_count"])
        if post == CENTER and pre != post:
            incoming[pre] += int(row["syn_count"])

    left = strongest(incoming)
    right = strongest(outgoing, left)
    ids = [*left, CENTER, *right]
    lookup = {cell: index for index, cell in enumerate(ids)}
    weights = Counter()
    for row in records(connections):
        pre, post = row["pre_root_id"], row["post_root_id"]
        if pre != post and pre in lookup and post in lookup:
            weights[lookup[pre], lookup[post]] += int(row["syn_count"])

    names = {row["root_id"]: row["primary_type"] for row in records(types) if row["root_id"] in lookup}
    counts = Counter(names.values())
    occurrences = Counter()
    nodes = []

    for index, cell in enumerate(ids):
        name = names.get(cell) or "Cell " + cell[-4:]
        occurrences[name] += 1
        label = f"{name} {occurrences[name]}" if counts[name] > 1 else name
        if cell == CENTER:
            x, y = 380, 230
        elif index < len(left):
            x, y = 155, 89 + index * 57
        else:
            x, y = 605, 89 + (index - len(left) - 1) * 57
        nodes.append(dict(id=cell, label=label, x=x, y=y))

    edges = [[pre, post, weight] for (pre, post), weight in sorted(weights.items())]
    return dict(nodes=nodes, edges=edges, center=lookup[CENTER], maximum=max(weights.values()))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("connections", type=Path)
    parser.add_argument("cell_types", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    data = extract(args.connections, args.cell_types)
    args.output.write_text(json.dumps(data, separators=(",", ":")) + "\n", encoding="utf-8")
