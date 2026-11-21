# Credits and licenses

## Solar observations

The two opening views come from [NASA's Scientific Visualization Studio release 3999](https://svs.gsfc.nasa.gov/3999/), visualized by Tom Bridgman from NASA/SDO AIA observations. Logic uses frames 00800 at [30.4 nm](https://svs.gsfc.nasa.gov/vis/a000000/a003900/a003999/AIA304AugustCME.00800.jpg) and [17.1 nm](https://svs.gsfc.nasa.gov/vis/a000000/a003900/a003999/AIA171AugustCME.00800.jpg) from August 31, 2012. The images are resized and converted to WebP. The lens composites these two views locally. See [NASA media usage](https://www.nasa.gov/nasa-brand-center/images-and-media/).

## Connectomics

The directed subgraph uses the FlyWire Consortium's female adult fly brain snapshot FAFB v783. Credit Dorkenwald et al., *Neuronal wiring diagram of an adult brain*, [Nature 634, 124–138 (2024)](https://doi.org/10.1038/s41586-024-07558-y), and Schlegel et al., [whole-brain cell-type annotation](https://doi.org/10.1038/s41586-024-07686-5). The input tables are [connections_princeton.csv.gz](https://storage.googleapis.com/flywire-data/codex/data/fafb/783/connections_princeton.csv.gz) and [consolidated_cell_types.csv.gz](https://storage.googleapis.com/flywire-data/codex/data/fafb/783/consolidated_cell_types.csv.gz). FlyWire publishes these data under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). See the [FlyWire principles](https://flywire.ai/principles.html) and [citation guide](https://codex.flywire.ai/about_flywire).

## Models and type

- Leaky integrate-and-fire model. [Gerstner et al., *Neuronal Dynamics*, §1.3](https://neuronaldynamics.epfl.ch/online/Ch1.S3.html).
- Newton basins. [MIT OpenCourseWare, *Newton Iterations*](https://ocw.mit.edu/courses/18-04-complex-variables-with-applications-fall-1999/pages/study-materials/newton/).
- [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans) and [Instrument Serif](https://github.com/Instrument/instrument-serif) ship with their SIL Open Font License notices in [assets/fonts](assets/fonts).

## Engineering archive

Archive images retain their original licenses. Files were converted to WebP and presentation crops, grading and shader treatments are applied. Adapted CC BY-SA images remain under the same CC BY-SA license. No endorsement is implied.

- **CMS detector** — SimonWaldherr. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). [Original source](https://commons.wikimedia.org/wiki/File:CERN_LHC_CMS_11.jpg). Packaged size: 720 × 480.
- **Wendelstein 7-X** — SimonWaldherr. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). [Original source](https://commons.wikimedia.org/wiki/File:Wendelstein_7-X.jpg). Packaged size: 640 × 480.
- **Webb primary mirror** — NASA/MSFC/David Higginbotham. [Public domain](https://commons.wikimedia.org/wiki/File:James_Webb_Primary_Mirror.jpg). [Original source](https://commons.wikimedia.org/wiki/File:James_Webb_Primary_Mirror.jpg). Packaged size: 721 × 480.
- **NIF target chamber** — Lawrence Livermore National Security. [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). [Original source](https://commons.wikimedia.org/wiki/File:National_Ignition_Facility%27s_target_chamber.jpg). Packaged size: 721 × 480.
- **Millau Viaduct** — W. Bulach. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). [Original source](https://commons.wikimedia.org/wiki/File:00_0237_Millau_-_D%C3%A9partement_Aveyron.jpg). Packaged size: 720 × 480.
- **Bacterial ribosome · 4V9D** — RCSB PDB / PDB-101. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). [Original source](https://pdb101.rcsb.org/global-health/antimicrobial-resistance/drugs/antibiotics/protein-synthesis/ribosome/ribosome). Packaged size: 1170 × 646.

Code dependency: [Three.js](https://github.com/mrdoob/three.js), MIT. Scientific visual references: [CERN detector structure](https://cms.cern/about/detector), [ITER magnet systems](https://www.iter.org/machine/magnets), [RCSB PDB-101](https://pdb101.rcsb.org/). These references inform subject selection; the engine does not claim to simulate their physics.
