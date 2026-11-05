# Paper results and analysis

The author-provided paper PDF is the sole authority for every reported result in the README and this directory. Tables reproduce its values and precision; figures are direct excerpts. Archived experiment logs and earlier drafts must not replace the paper's final results.

## Table data

| Paper item | Page | File | Contents |
|---|---:|---|---|
| Table 1 | 6 | [checkpoint_scores.csv](data/checkpoint_scores.csv) | Sixteen main-result rows, four benchmarks, averages, and reported gains. |
| Table 2 | 6 | [critic_alignment.csv](data/critic_alignment.csv) | Quality alignment and reward coverage for parent, matched-child, and shuffled-child scoring. |
| Table 3 | 7 | [optimization_scores.csv](data/optimization_scores.csv) | Qwen3-4B Medicine comparison with DAPO-style and GRPO+OPSD. |
| Table 4 | 7 | [ood_scores.csv](data/ood_scores.csv) | MT-Bench and FollowBench results at both model scales. |
| Table 5 | 8 | [ablation_scores.csv](data/ablation_scores.csv) | Combined method, standalone components, and gate/filter ablations. |
| Table 10 | 20 | [critic_case.json](data/critic_case.json) | Expiration-muscles query, parent and child criteria, eight response excerpts, and judge verdicts. |

Benchmark scores are percentages unless noted otherwise. MT-Bench uses a 0-10 scale. Main-table averages span four benchmarks; Medicine-only averages span two. Gains and averages retain the paper's reported precision rather than being recalculated from rounded cells. OPSD* is an external reference from CriPO with filtered RaR splits and a GPT-4o-mini judge; it is marked separately from locally evaluated methods.

## Original figure excerpts

| Paper item | Page | Asset | Measurement |
|---|---:|---|---|
| Figure 4 | 6 | [teacher_recovery.png](../assets/teacher_recovery.png) | Unguided recovery on a fixed initially unreachable cohort. |
| Figure 5 | 7 | [critic_dispersion.png](../assets/critic_dispersion.png) | Reward discrimination on rollouts independent of child selection. |
| Figure 6 | 7 | [policy_gains.png](../assets/policy_gains.png) | Unreachable-rate reduction and child-satisfaction gains relative to GRPO. |

The figures are cropped directly from the paper at 300 dpi. No curves were reconstructed from images, and no tables were converted into bar charts. The source PDF hash, page numbers, crop coordinates and image hashes are in [paper_sources.json](data/paper_sources.json). The main-table transcription scope is recorded in [main_table_source.json](data/main_table_source.json).

The public package contains the figure excerpts and transcribed table data, not the complete underlying per-response logs for these analyses. Use [evaluation/](../evaluation/) to evaluate newly trained checkpoints.

## Verified correspondence

All 220 numeric entries in the CSV files, including the paper's reported gains, match Tables 1-5. The README displays the same scores with gain annotations omitted. The Critic case matches all 32 binary verdicts, the four pass counts, the criterion wording, and the eight response excerpts in Table 10. Figures 4-6 are byte-identical to fresh crops from the recorded PDF regions. Analysis percentages and cohort sizes are checked against Section 4.3; arithmetic differences are derived only from the paper's values.

The PDF identity and per-table verification counts are recorded in [paper_sources.json](data/paper_sources.json). New evaluation outputs belong to their own run records and do not update these reported paper results.
