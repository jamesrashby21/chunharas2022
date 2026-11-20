# PSYC 201A Replication Project (Fall 2026) by James Ashby

This repository consists of an experimental replication of 'An Adaptive Perspective on Visual Working Memory Distortions' by Chunharas, Rademaker, Brady, and Serences (2022, Journal of Experimental Psychology). Data will be collected using the UC San Diego SONA platform, with a modernized version of the task code built using the Brady Lab's plugins (Vision and Memory Lab @ UC San Diego).

File Structure:

1. "data" -- Consists of the data from the original study ("original_data"), which contains the MATLAB participant data (EXP1.csv, EXP1.mat, Fig1c.m) and the data analysis R code (allEXPs_in_R.R) taken from the original paper's OSF repository.

2. "original_paper" -- The pdf of the original paper (chunharas2022.pdf) and the original visual memory task code ("original_task_code": WMbias_2AFC_241.html, jquery.js, vismemCC.js) taken from the original paper's OSF repository.

3. "writeup" -- The Replication Report written out (replication_report.pdf), which includes the introduction, methods, procedure, sample population, differences from the original study, and data analysis plan for the replication experiment. The report is written in Quarto (replication_report.qmd) and contains the R data analysis code, wrapped in-text with the write-up and rendered into a pdf. The original study's data (EXP1.csv) is also kept here for the power analysis.

4. "task" -- Contains the updated task code in the "task" subfolder (chunharas2022.html), alongside the task code from the original paper (original_WMbias_2AFC.html). The updated task code uses jsPsych 8.4.0 and the Brady Lab's plugins with predesigned stimuli (brady-color-wheel.js, brady-plugin-utils.js, jspsych-wm-forced-choice.js), and it will only run when these three plugin files are in the same folder as chunharas2022.html.

5. "renv" -- A folder created by the R package "renv" that creates isolated, portable, and reproducible package environments for individual R projects. This allows for full reproducibility within "replication_report.qmd".