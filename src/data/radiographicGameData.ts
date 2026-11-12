export type GameLevel = 'easy' | 'medium' | 'difficult';

export type GameItemType = 'missing_word' | 'marble_trivia';

export interface RadiographicGameItem {
  id: string;
  type: GameItemType;
  level: GameLevel;
  category: string;
  question: string;
  clue: string;
  // For 'missing_word' game items
  targetWord?: string; // Uppercase word to spell, e.g. "ALARA"
  // For 'marble_trivia' game items
  options?: string[]; // 4 options
  correctIndex?: number;
  explanation: string;
  points: number;
}

export const RADIOGRAPHIC_GAME_ITEMS: RadiographicGameItem[] = [
  // ==========================================
  // LEVEL 1: EASY (Foundational Radiography)
  // ==========================================
  {
    id: 'easy_mw_1',
    type: 'missing_word',
    level: 'easy',
    category: 'Radiation Safety',
    question: 'The golden principle of radiation protection ensuring patient exposures are kept as low as reasonably achievable is known as:',
    clue: 'Guiding safety acronym for time, distance, and shielding in clinical imaging.',
    targetWord: 'ALARA',
    explanation: 'ALARA (As Low As Reasonably Achievable) is the fundamental radiation protection principle governing all medical radiographic exposures.',
    points: 100,
  },
  {
    id: 'easy_tr_2',
    type: 'marble_trivia',
    level: 'easy',
    category: 'Radiation Safety',
    question: 'Which material is standardly used in aprons and room barriers to shield against scattered secondary X-rays?',
    clue: 'Dense element with atomic number 82.',
    options: ['Lead', 'Aluminum', 'Copper', 'Titanium'],
    correctIndex: 0,
    explanation: 'Lead (Pb) has a high atomic number (Z=82) and high density, making it optimal for absorbing diagnostic secondary scatter radiation.',
    points: 100,
  },
  {
    id: 'easy_mw_3',
    type: 'missing_word',
    level: 'easy',
    category: 'X-Ray Physics',
    question: 'The parameter that primarily controls the penetrability and beam quality of the X-ray beam is:',
    clue: 'Unit measured in thousands of volts applied across the X-ray tube.',
    targetWord: 'KVP',
    explanation: 'Kilovoltage peak (kVp) controls the maximum energy of photons in the X-ray beam, thereby dictating radiographic penetrability and subject contrast.',
    points: 100,
  },
  {
    id: 'easy_mw_4',
    type: 'missing_word',
    level: 'easy',
    category: 'X-Ray Equipment',
    question: 'The scatter-reduction device composed of alternating lead strips placed between the patient and image receptor is a:',
    clue: 'Invented by Dr. Gustav Bucky in 1913 to clean up scatter radiation.',
    targetWord: 'GRID',
    explanation: 'A radiographic grid absorbs oblique scattered photons emitted by the patient before they hit the receptor, dramatically improving contrast.',
    points: 100,
  },
  {
    id: 'easy_tr_5',
    type: 'marble_trivia',
    level: 'easy',
    category: 'X-Ray Physics',
    question: 'Which component in the X-ray tube serves as the rotating or stationary target where electrons decelerate to produce X-rays?',
    clue: 'The positive electrode made of tungsten.',
    options: ['Anode', 'Cathode', 'Focusing cup', 'Rotor stator'],
    correctIndex: 0,
    explanation: 'The anode is the positive electrode containing the tungsten target where high-speed electrons strike to produce bremsstrahlung and characteristic X-rays.',
    points: 100,
  },
  {
    id: 'easy_mw_6',
    type: 'missing_word',
    level: 'easy',
    category: 'Radiation Safety',
    question: 'Restricting the dimensions of the X-ray beam to match only the anatomical region of interest is called:',
    clue: 'Adjusted using manual or automatic lead shutters on the tube housing.',
    targetWord: 'COLLIMATION',
    explanation: 'Strict beam collimation reduces total irradiated patient volume, drastically lowers scatter production, and sharpens radiographic detail.',
    points: 100,
  },
  {
    id: 'easy_tr_7',
    type: 'marble_trivia',
    level: 'easy',
    category: 'Image Quality',
    question: 'What is the primary factor controlling the total quantity of X-ray photons emitted during an exposure?',
    clue: 'Product of tube current and exposure duration.',
    options: ['mAs (Milliampere-seconds)', 'Focal spot size', 'Source-to-image distance', 'Filtration'],
    correctIndex: 0,
    explanation: 'mAs (tube current multiplied by exposure time in seconds) directly controls beam quantity and total optical density/exposure level.',
    points: 100,
  },
  {
    id: 'easy_mw_8',
    type: 'missing_word',
    level: 'easy',
    category: 'General Anatomy',
    question: 'The most commonly performed projection in upright chest radiography where the beam enters posteriorly is:',
    clue: 'Standard two-letter acronym for Posterior-Anterior projection.',
    targetWord: 'PA',
    explanation: 'The PA (posteroanterior) chest projection minimizes cardiac magnification because the heart lies anteriorly, closest to the detector.',
    points: 100,
  },
  {
    id: 'easy_tr_9',
    type: 'marble_trivia',
    level: 'easy',
    category: 'Radiographic Anatomy',
    question: 'Which anatomical structure displays the highest radiopacity (appears brightest white) on plain film radiography?',
    clue: 'Dense cortical bone and metal implants.',
    options: ['Cortical Bone', 'Subcutaneous Fat', 'Aerated Lung', 'Pectoral Muscle'],
    correctIndex: 0,
    explanation: 'Cortical bone possesses the highest physical density and effective atomic number among normal tissues, resulting in maximum X-ray absorption (white).',
    points: 100,
  },
  {
    id: 'easy_mw_10',
    type: 'missing_word',
    level: 'easy',
    category: 'Radiographic Tech',
    question: 'The negative electrode of the X-ray tube containing the heated filament is the:',
    clue: 'Emits electrons through thermionic emission.',
    targetWord: 'CATHODE',
    explanation: 'The cathode is the negative electrode containing the tungsten filament; heating it causes thermionic emission of electrons.',
    points: 100,
  },
  {
    id: 'easy_tr_11',
    type: 'marble_trivia',
    level: 'easy',
    category: 'Radiation Safety',
    question: 'According to the Inverse Square Law, if you double your distance from a radiation source, the intensity drops to:',
    clue: 'One divided by distance squared.',
    options: ['1/4 of original intensity', '1/2 of original intensity', '1/8 of original intensity', 'Zero intensity'],
    correctIndex: 0,
    explanation: 'Intensity is inversely proportional to the square of the distance (I ∝ 1/d²). Doubling distance reduces exposure intensity to one-fourth (25%).',
    points: 100,
  },
  {
    id: 'easy_mw_12',
    type: 'missing_word',
    level: 'easy',
    category: 'Radiographic Media',
    question: 'The light-tight container historically used to hold radiographic film or phosphor storage plates is a:',
    clue: 'Rigid cassette loaded into bucky trays.',
    targetWord: 'CASSETTE',
    explanation: 'A cassette holds radiographic film or computed radiography (CR) imaging plates securely in place while shielding them from ambient light.',
    points: 100,
  },
  {
    id: 'easy_tr_13',
    type: 'marble_trivia',
    level: 'easy',
    category: 'Chest Radiography',
    question: 'A good inspiratory adult PA chest radiograph should clearly demonstrate at least how many posterior ribs above the diaphragm?',
    clue: 'Standard diagnostic inspiratory count.',
    options: ['10 posterior ribs', '6 posterior ribs', '12 posterior ribs', '4 posterior ribs'],
    correctIndex: 0,
    explanation: 'Adequate adult inspiratory effort is demonstrated by visualizing at least 9 to 10 posterior ribs (or 6 anterior ribs) above the right hemidiaphragm.',
    points: 100,
  },
  {
    id: 'easy_mw_14',
    type: 'missing_word',
    level: 'easy',
    category: 'Physics & Units',
    question: 'The SI unit for absorbed radiation dose representing 1 Joule of energy absorbed per kilogram of tissue is the:',
    clue: 'Abbreviated Gy, named after English physicist Louis Harold Gray.',
    targetWord: 'GRAY',
    explanation: 'The Gray (Gy) is the international SI unit of absorbed ionizing radiation dose (1 Gy = 1 J/kg).',
    points: 100,
  },
  {
    id: 'easy_tr_15',
    type: 'marble_trivia',
    level: 'easy',
    category: 'Clinical Practice',
    question: 'Which anatomical landmark aligns with the fifth cervical vertebra (C5) in surface positioning?',
    clue: 'Prominent cartilage in the anterior neck.',
    options: ['Thyroid cartilage (Adam\'s apple)', 'Mastoid tip', 'Jugular notch', 'Sternal angle'],
    correctIndex: 0,
    explanation: 'The prominence of the thyroid cartilage typically marks the level of the C5 vertebra (with C4 at the superior margin).',
    points: 100,
  },

  // ==========================================
  // LEVEL 2: MEDIUM (Cross-Sectional & System Imaging)
  // ==========================================
  {
    id: 'med_mw_1',
    type: 'missing_word',
    level: 'medium',
    category: 'Computed Tomography',
    question: 'The numerical quantitative scale used in CT to describe radiodensity relative to water (0 HU) and air (-1000 HU) is:',
    clue: 'Named after Sir Godfrey, Nobel laureate who co-invented CT.',
    targetWord: 'HOUNSFIELD',
    explanation: 'Hounsfield Units (HU) calibrate CT pixel values from air (-1000 HU) through pure water (0 HU) to dense cortical bone (+1000 to +3000 HU).',
    points: 150,
  },
  {
    id: 'med_tr_2',
    type: 'marble_trivia',
    level: 'medium',
    category: 'MRI Physics',
    question: 'In magnetic resonance imaging, which atomic nucleus is predominantly imaged due to its abundance in the human body and high gyromagnetic ratio?',
    clue: 'Single proton nucleus in water and fat molecules.',
    options: ['Hydrogen (1H)', 'Carbon (12C)', 'Sodium (23Na)', 'Phosphorus (31P)'],
    correctIndex: 0,
    explanation: 'Hydrogen (1H) consists of a single proton with a large magnetic moment and is ubiquitous in biological tissue (water and lipids).',
    points: 150,
  },
  {
    id: 'med_mw_3',
    type: 'missing_word',
    level: 'medium',
    category: 'Ultrasound Imaging',
    question: 'The change in frequency or pitch of sound waves reflected from moving red blood cells is the principle of:',
    clue: 'Named after Christian Doppler, used for vascular blood flow mapping.',
    targetWord: 'DOPPLER',
    explanation: 'The Doppler effect calculates blood velocity and direction based on the frequency shift between transmitted and reflected ultrasound waves.',
    points: 150,
  },
  {
    id: 'med_tr_4',
    type: 'marble_trivia',
    level: 'medium',
    category: 'Computed Tomography',
    question: 'What is the standard CT Hounsfield Unit (HU) measurement for pure unenhanced water?',
    clue: 'Baseline reference point on the CT number scale.',
    options: ['0 HU', '-1000 HU', '+50 HU', '-50 HU'],
    correctIndex: 0,
    explanation: 'Water is explicitly defined as 0 HU. Air is calibrated to -1000 HU and dense bone reaches +1000 HU or greater.',
    points: 150,
  },
  {
    id: 'med_mw_5',
    type: 'missing_word',
    level: 'medium',
    category: 'MRI Contrast',
    question: 'The paramagnetic rare-earth metal ion used as the active agent in intravenous MRI contrast media is:',
    clue: 'Shortens T1 relaxation times of nearby tissues.',
    targetWord: 'GADOLINIUM',
    explanation: 'Gadolinium-based contrast agents (GBCAs) contain seven unpaired electrons that markedly shorten T1 relaxation, causing bright enhancement.',
    points: 150,
  },
  {
    id: 'med_tr_6',
    type: 'marble_trivia',
    level: 'medium',
    category: 'MRI Weighting',
    question: 'On a standard T2-weighted MRI scan, how does simple free cerebrospinal fluid (CSF) appear?',
    clue: 'Long T2 decay time gives fluids high signal.',
    options: ['Bright (Hyperintense)', 'Dark (Hypointense)', 'Intermediate gray', 'Completely black void'],
    correctIndex: 0,
    explanation: 'Free water and CSF have long T2 relaxation times and appear hyperintense (bright white) on T2-weighted sequences ("T2 is H2O").',
    points: 150,
  },
  {
    id: 'med_mw_7',
    type: 'missing_word',
    level: 'medium',
    category: 'CT Technology',
    question: 'In helical CT scanning, the ratio of patient table travel per 360-degree gantry rotation to the total X-ray beam width is the:',
    clue: 'Ratio determining scan speed and overlap; values > 1 increase speed and lower dose.',
    targetWord: 'PITCH',
    explanation: 'CT pitch = Table distance traveled per gantry rotation / Beam collimation. Pitch > 1 extends coverage and reduces patient dose.',
    points: 150,
  },
  {
    id: 'med_tr_8',
    type: 'marble_trivia',
    level: 'medium',
    category: 'Ultrasound Transducers',
    question: 'What physical property allows piezoelectric crystals in ultrasound probes to convert electrical voltage into mechanical sound waves?',
    clue: 'Discovered by the Curie brothers in 1880.',
    options: ['Piezoelectric effect', 'Photoelectric effect', 'Compton scattering', 'Thermionic emission'],
    correctIndex: 0,
    explanation: 'The piezoelectric effect expands and contracts lead zirconate titanate (PZT) crystals when electrical voltage is applied, emitting ultrasonic sound.',
    points: 150,
  },
  {
    id: 'med_mw_9',
    type: 'missing_word',
    level: 'medium',
    category: 'Digital Radiography',
    question: 'A 3-dimensional volume element representing depth in cross-sectional CT or MRI imaging is called a:',
    clue: 'Volume counterpart of a 2D pixel.',
    targetWord: 'VOXEL',
    explanation: 'A voxel (volumetric pixel) represents a 3D unit of volume defined by pixel width, pixel height, and slice thickness.',
    points: 150,
  },
  {
    id: 'med_tr_10',
    type: 'marble_trivia',
    level: 'medium',
    category: 'Radiation Interactions',
    question: 'Which fundamental X-ray interaction with matter is predominantly responsible for occupational dose and image fog in diagnostic radiography?',
    clue: 'Inelastic collision with outer-shell electron.',
    options: ['Compton scattering', 'Photoelectric absorption', 'Coherent scattering', 'Pair production'],
    correctIndex: 0,
    explanation: 'Compton scattering dominates in soft tissue at diagnostic energies (70–120 kVp), deflecting scattered photons toward technologists and image receptors.',
    points: 150,
  },
  {
    id: 'med_mw_11',
    type: 'missing_word',
    level: 'medium',
    category: 'Ultrasound Artifacts',
    question: 'The acoustic artifact where sound waves are completely reflected or absorbed by bone or gallstones, leaving a black void beneath, is acoustic:',
    clue: 'Dark drop-out beneath high-attenuator structures.',
    targetWord: 'SHADOWING',
    explanation: 'Acoustic shadowing occurs distal to highly attenuating or reflective interfaces (such as calculi or cortical bone), creating an anechoic shadow.',
    points: 150,
  },
  {
    id: 'med_tr_12',
    type: 'marble_trivia',
    level: 'medium',
    category: 'CT Post-Processing',
    question: 'In CT image display, narrowing the Window Width (WW) while keeping Window Level (WL) constant has what effect on visual contrast?',
    clue: 'Fewer HU numbers distributed across 256 gray shades.',
    options: ['Increases image contrast', 'Decreases image contrast', 'Has no effect on contrast', 'Inverts the image grayscale'],
    correctIndex: 0,
    explanation: 'Narrowing the Window Width assigns the available grayscale shades across a smaller range of Hounsfield units, producing higher visual contrast.',
    points: 150,
  },
  {
    id: 'med_mw_13',
    type: 'missing_word',
    level: 'medium',
    category: 'Contrast Agents',
    question: 'The water-soluble element universally used as the radio-opaque component in intravascular CT contrast media is:',
    clue: 'Halogen with atomic number 53.',
    targetWord: 'IODINE',
    explanation: 'Iodine has an atomic number of 53 and a k-edge of 33.2 keV, which aligns well with diagnostic CT X-ray spectra for strong photoelectric attenuation.',
    points: 150,
  },
  {
    id: 'med_tr_14',
    type: 'marble_trivia',
    level: 'medium',
    category: 'Fluoroscopy Safety',
    question: 'In mobile C-arm fluoroscopy, where should the X-ray tube be placed relative to the patient to minimize operator scatter dose?',
    clue: 'Underneath the operating table.',
    options: ['Under the patient table (tube below, detector above)', 'Above the patient (tube on top)', 'Directly at eye level with the surgeon', 'Touching the sterile surgical field'],
    correctIndex: 0,
    explanation: 'Placing the tube underneath the table directs backscatter toward the floor rather than toward the operator\'s upper body, thyroid, and eyes.',
    points: 150,
  },
  {
    id: 'med_mw_15',
    type: 'missing_word',
    level: 'medium',
    category: 'Image Artifacts',
    question: 'In CT, dark streaks seen between two highly dense objects like metal dental fillings or hip prostheses are caused by beam:',
    clue: 'Selective filtration of low-energy photons as the polyenergetic beam traverses metal.',
    targetWord: 'HARDENING',
    explanation: 'Beam hardening occurs when lower-energy photons are preferentially absorbed by dense structures, shifting the beam spectrum and creating dark streak artifacts.',
    points: 150,
  },

  // ==========================================
  // LEVEL 3: DIFFICULT (Advanced Modalities & Pathology)
  // ==========================================
  {
    id: 'diff_mw_1',
    type: 'missing_word',
    level: 'difficult',
    category: 'MRI Physics',
    question: 'The raw frequency domain data matrix in MRI where raw spatial frequency signals are collected prior to 2D Fourier Transformation is called:',
    clue: 'Letter "k" space representing spatial frequency.',
    targetWord: 'KSPACE',
    explanation: 'k-space is the temporary spatial frequency matrix in MRI memory. Its central lines dictate contrast and peripheral lines encode fine spatial resolution.',
    points: 200,
  },
  {
    id: 'diff_tr_2',
    type: 'marble_trivia',
    level: 'difficult',
    category: 'Nuclear Medicine',
    question: 'Which radioisotope is the most widely utilized diagnostic radiotracer in SPECT imaging due to its 6-hour half-life and 140 keV gamma emission?',
    clue: 'Metastable isotope derived from Molybdenum-99 generators.',
    options: ['Technetium-99m (99mTc)', 'Fluorine-18 (18F)', 'Iodine-131 (131I)', 'Thallium-201 (201Tl)'],
    correctIndex: 0,
    explanation: 'Technetium-99m (99mTc) is the clinical workhorse of nuclear medicine, emitting pure 140 keV gamma rays with an ideal 6.02-hour physical half-life.',
    points: 200,
  },
  {
    id: 'diff_mw_3',
    type: 'missing_word',
    level: 'difficult',
    category: 'MRI Physics',
    question: 'The mathematical equation stating that the precession frequency of hydrogen protons is proportional to magnetic field strength (ω = γB0) is the:',
    clue: 'Named after Irish physicist Sir Joseph Larmor.',
    targetWord: 'LARMOR',
    explanation: 'The Larmor Equation (f = γB0 / 2π) governs MRI resonant frequency, dictating that 1H protons precess at 63.86 MHz in a 1.5 Tesla magnetic field.',
    points: 200,
  },
  {
    id: 'diff_tr_4',
    type: 'marble_trivia',
    level: 'difficult',
    category: 'PET Imaging',
    question: 'In Positron Emission Tomography (PET), what happens when an emitted positron collides with an orbital electron in tissue?',
    clue: 'Energy conversion into two 511 keV photons traveling in opposite directions.',
    options: ['Annihilation producing two 511 keV photons at 180°', 'Compton scattering without gamma emission', 'Photoelectric capture generating Bremsstrahlung', 'Coherent internal conversion'],
    correctIndex: 0,
    explanation: 'Electron-positron annihilation converts rest mass into two 511 keV coincidence gamma rays traveling approximately 180 degrees apart.',
    points: 200,
  },
  {
    id: 'diff_mw_5',
    type: 'missing_word',
    level: 'difficult',
    category: 'Interventional Radiology',
    question: 'The real-time continuous X-ray visualization technique used to guide catheters, stents, and needles during angiographic procedures is:',
    clue: 'Dynamic projection imaging using pulsed X-ray tubes and flat panel detectors.',
    targetWord: 'FLUOROSCOPY',
    explanation: 'Fluoroscopy provides dynamic, real-time radiographic visualization essential for catheter manipulation and stent positioning.',
    points: 200,
  },
  {
    id: 'diff_tr_6',
    type: 'marble_trivia',
    level: 'difficult',
    category: 'MRI Artifacts',
    question: 'In MRI, what causes the Chemical Shift artifact seen at interfaces between visceral water and retroperitoneal fat (e.g., surrounding kidney margins)?',
    clue: 'Differences in electron shielding cause a 3.5 ppm frequency shift between water and fat protons.',
    options: ['Difference in Larmor resonance frequencies between fat and water', 'Inadequate patient breath-holding during acquisition', 'Phase-encoding aliasing along the frequency direction', 'Non-linear gradient coil overheating'],
    correctIndex: 0,
    explanation: 'Protons in fat are chemically shielded by electron clouds, causing them to precess ~3.5 ppm slower than protons in water, misregistering them by several pixels.',
    points: 200,
  },
  {
    id: 'diff_mw_7',
    type: 'missing_word',
    level: 'difficult',
    category: 'PET Radiopharmacy',
    question: 'The most commonly injected glucose analog radiopharmaceutical used in oncologic PET-CT imaging is:',
    clue: 'Fluorodeoxyglucose labeled with 18F.',
    targetWord: 'FDG',
    explanation: '18F-FDG (Fluorodeoxyglucose) is taken up avidly by metabolically active neoplastic cells via GLUT receptors and trapped by hexokinase phosphorylation.',
    points: 200,
  },
  {
    id: 'diff_tr_8',
    type: 'marble_trivia',
    level: 'difficult',
    category: 'CT Dosimetry',
    question: 'Which standardized dose metric in CT represents the average absorbed dose in a standardized acrylic phantom across a single axial slice?',
    clue: 'Computed Tomography Dose Index.',
    options: ['CTDIvol', 'Dose-Length Product (DLP)', 'Entrance Skin Exposure (ESE)', 'Effective Dose (Sv)'],
    correctIndex: 0,
    explanation: 'CTDIvol (Volume CT Dose Index, in mGy) measures average radiation dose inside the scan volume for a standard CT phantom, accounting for helical pitch.',
    points: 200,
  },
  {
    id: 'diff_mw_9',
    type: 'missing_word',
    level: 'difficult',
    category: 'MRI Safety',
    question: 'The rate at which RF electromagnetic energy is absorbed per unit mass of patient tissue during an MRI scan (measured in W/kg) is:',
    clue: 'Specific Absorption Rate.',
    targetWord: 'SAR',
    explanation: 'Specific Absorption Rate (SAR, in Watts/kg) limits RF thermal deposition to avoid dangerous patient heating (restricted to <2 to 4 W/kg).',
    points: 200,
  },
  {
    id: 'diff_tr_10',
    type: 'marble_trivia',
    level: 'difficult',
    category: 'Radiation Biology',
    question: 'The Law of Bergonie and Tribondeau dictates that biological tissues are most radiosensitive when cells are:',
    clue: 'Rapidly proliferating, undifferentiated stem cells.',
    options: ['Rapidly dividing with high metabolic rate and undifferentiated', 'Mature, highly differentiated, and slow-dividing', 'Devascularized and hypoxic', 'In permanent post-mitotic arrest'],
    correctIndex: 0,
    explanation: 'Bergonie and Tribondeau established that cell radiosensitivity is highest for cells that divide rapidly, have long mitotic futures, and are least differentiated.',
    points: 200,
  },
  {
    id: 'diff_mw_11',
    type: 'missing_word',
    level: 'difficult',
    category: 'X-ray Interaction',
    question: 'The sudden braking and deceleration of high-speed cathode electrons as they deflect past heavy tungsten nuclei produces radiation called:',
    clue: 'German term for "braking radiation".',
    targetWord: 'BREMSSTRAHLUNG',
    explanation: 'Bremsstrahlung ("braking radiation") accounts for 85–90% of diagnostic X-rays produced when energetic incident electrons decelerate in the target field.',
    points: 200,
  },
  {
    id: 'diff_tr_12',
    type: 'marble_trivia',
    level: 'difficult',
    category: 'Angiography',
    question: 'In Digital Subtraction Angiography (DSA), what is the function of the "mask" image acquired prior to contrast injection?',
    clue: 'Subtracted from post-contrast frames to remove bone and soft tissue.',
    options: ['It is subtracted from subsequent contrast frames to isolate opacified vessels', 'It calibrates the monitor display brightness', 'It calculates the renal clearance of the patient', 'It determines catheter tip sterility'],
    correctIndex: 0,
    explanation: 'DSA subtracts a pre-contrast mask image from subsequent post-contrast images, leaving only the contrast-filled vascular tree visible with no bony overlap.',
    points: 200,
  },
  {
    id: 'diff_mw_13',
    type: 'missing_word',
    level: 'difficult',
    category: 'MRI Sequences',
    question: 'The rapid MRI pulse sequence that utilizes an initial 90-degree RF excitation pulse followed by a 180-degree refocusing pulse is a spin:',
    clue: 'Echo pulse sequence that corrects for magnetic field inhomogeneities.',
    targetWord: 'ECHO',
    explanation: 'Spin Echo sequences use a 180° refocusing pulse to reverse dephasing caused by magnetic field inhomogeneities, eliminating T2* decay.',
    points: 200,
  },
  {
    id: 'diff_tr_14',
    type: 'marble_trivia',
    level: 'difficult',
    category: 'CT Technology',
    question: 'Modern dual-energy CT (DECT) exploits differences in which phenomenon across two X-ray energies (e.g., 80 kVp vs 140 kVp) to differentiate uric acid gout from calcium?',
    clue: 'Material-specific attenuation based on photoelectric k-edge differences.',
    options: ['Energy-dependent Photoelectric absorption and electron density', 'Thermal conduction within soft tissues', 'Proton spin coherence relaxation', 'Piezoelectric mechanical resonance'],
    correctIndex: 0,
    explanation: 'Dual-energy CT scans simultaneously at high and low kVp to map the atomic number and photoelectric absorption curve of materials (e.g., uric acid vs calcium).',
    points: 200,
  },
  {
    id: 'diff_mw_15',
    type: 'missing_word',
    level: 'difficult',
    category: 'Nuclear Medicine',
    question: 'The device used in planar scintigraphy and SPECT to detect gamma ray photons and convert them into digital images is the gamma:',
    clue: 'Also known as the Anger camera.',
    targetWord: 'CAMERA',
    explanation: 'The gamma camera (invented by Hal Anger) uses sodium iodide NaI(Tl) scintillation crystals and photomultiplier tubes to image radioactive tracer distributions.',
    points: 200,
  },
];

/**
 * Built-in Web Audio Sound Synthesizer
 * Produces crisp, satisfying audio feedback without any external asset downloads
 */
class SoundEffects {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Letter tap / marble click sound
  public playMarbleTap() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {}
  }

  // Correct answer / word solved chime
  public playSuccessChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0.14, ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + idx * 0.06 + 0.22);
      });
    } catch {}
  }

  // Wrong / strike sound
  public playWrong() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {}
  }

  // Streak combo sound
  public playStreakFanfare() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + idx * 0.05 + 0.3);
      });
    } catch {}
  }
}

export const soundFx = new SoundEffects();
