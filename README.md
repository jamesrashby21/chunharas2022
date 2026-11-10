# PSYC 201A Replication Project (Fall 2026)

This repository consists of an experimental replication of 'An Adaptive Perspective on Visual Working Memory Distortions' by Chunharas, Rademaker, Brady, and Serences (2022, Journal of Experimental Psychology). Data will be collected using the UC San Diego SONA platform, and a modernized version of the task code using the Brady Lab's plugins. (Vision and Memory Lab @ UC San Diego)

File Structure:

1. "data" -- Consists of the data from the original study "data_codes" which contains the MATLAB participant data and the data analysis R code taken from the original paper's OSF repository.

2. "original_paper" -- The pdf of the original paper (Chunharas, 2022) and the original visual memory task code (WMbias_2AFC_241) taken from the original paper's OSF repository.

3. "writeup" -- The Replication Report written out (pdf), which includes, methods, procedure, sample population, differences from original study, and data analysis plan for the replication experiment. This also contains the R code that includes the data analysis code, wrapped in-text with the write-up using "Quarto" to render it into a pdf.

4. "task" -- Contains the updated task code (chunharas2022.html), alongisde the task code from the original paper (WMbias_2AFC_241.html), as well as the task code, along with the plugins in a folder (26TR04). The updated task code will only run within this folder, as it uses plugins with predesigned stimuli from the Brady Lab.