// Client Excel Master FY 25-26 Tally Data for HSD_DSR and Petrol_DSR
export interface DsrNozzleReading {
  reading: number;
  sales: number;
}

export interface DsrRecord {
  id: string;
  date: string;
  openingStock: number;
  purchase: number;
  totalStock: number;
  sales: number;
  closingStock: number;
  actualDip: number;
  variation: number;
  nozzles: Record<string, DsrNozzleReading>;
  totalMeterSales: number;
  pumpTesting: number;
  netSales: number;
}

export const HSD_NOZZLE_CONFIG = [
  { id: 'mpd1_nz1', name: 'Nz 1', mpd: 'MPD 1', label: 'MPD 1 Nz 1' },
  { id: 'mpd1_nz2', name: 'Nz 2', mpd: 'MPD 1', label: 'MPD 1 Nz 2' },
  { id: 'mpd1_nz3', name: 'Nz 3', mpd: 'MPD 1', label: 'MPD 1 Nz 3' },
  { id: 'mpd1_nz4', name: 'Nz 4', mpd: 'MPD 1', label: 'MPD 1 Nz 4' },
  { id: 'mpd2_nz1', name: 'Nz 1', mpd: 'MPD 2', label: 'MPD 2 Nz 1' },
  { id: 'mpd2_nz2', name: 'Nz 2', mpd: 'MPD 2', label: 'MPD 2 Nz 2' },
  { id: 'mpd3_nz1', name: 'Nz 1', mpd: 'MPD 3', label: 'MPD 3 Nz 1' },
  { id: 'mpd3_nz2', name: 'Nz 2', mpd: 'MPD 3', label: 'MPD 3 Nz 2' },
];

export const PETROL_NOZZLE_CONFIG = [
  { id: 'mpd2_nz3', name: 'Nz 3', mpd: 'MPD 2', label: 'MPD 2 Nz 3' },
  { id: 'mpd2_nz4', name: 'Nz 4', mpd: 'MPD 2', label: 'MPD 2 Nz 4' },
  { id: 'mpd3_nz3', name: 'Nz 3', mpd: 'MPD 3', label: 'MPD 3 Nz 3' },
  { id: 'mpd3_nz4', name: 'Nz 4', mpd: 'MPD 3', label: 'MPD 3 Nz 4' },
];

export const HSD_DSR_DATA: DsrRecord[] = [
  {
    "date": "2026-03-01",
    "openingStock": 30700.0,
    "purchase": 0.0,
    "totalStock": 30700.0,
    "sales": 11817.600000000093,
    "closingStock": 18882.399999999907,
    "actualDip": 18960.0,
    "variation": 77.60000000009313,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1148465.06,
        "sales": 1634.2299999999814
      },
      "mpd1_nz2": {
        "reading": 713214.68,
        "sales": 2070.8000000000466
      },
      "mpd1_nz3": {
        "reading": 1709871.48,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294440.2,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3428287.71,
        "sales": 2230.560000000056
      },
      "mpd2_nz2": {
        "reading": 4433295.14,
        "sales": 2439.3499999996275
      },
      "mpd3_nz1": {
        "reading": 1433778.55,
        "sales": 1423.9200000001583
      },
      "mpd3_nz2": {
        "reading": 2986388.5,
        "sales": 2048.7400000002235
      }
    },
    "totalMeterSales": 11857.600000000093,
    "pumpTesting": 40.0,
    "netSales": 11817.600000000093,
    "id": "hsd-1"
  },
  {
    "date": "2026-03-02",
    "openingStock": 18960.0,
    "purchase": 15000.0,
    "totalStock": 33960.0,
    "sales": 9513.049999999464,
    "closingStock": 24446.950000000536,
    "actualDip": 24379.0,
    "variation": -67.95000000053551,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1150298.0,
        "sales": 1832.9399999999441
      },
      "mpd1_nz2": {
        "reading": 715318.98,
        "sales": 2104.29999999993
      },
      "mpd1_nz3": {
        "reading": 1709876.48,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294445.2,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3429852.01,
        "sales": 1564.2999999998137
      },
      "mpd2_nz2": {
        "reading": 4435209.81,
        "sales": 1914.6699999999255
      },
      "mpd3_nz1": {
        "reading": 1434399.44,
        "sales": 620.8899999998976
      },
      "mpd3_nz2": {
        "reading": 2987915.02,
        "sales": 1526.5200000000186
      }
    },
    "totalMeterSales": 9573.61999999953,
    "pumpTesting": 60.57,
    "netSales": 9513.04999999953,
    "id": "hsd-2"
  },
  {
    "date": "2026-03-03",
    "openingStock": 24379.0,
    "purchase": 0.0,
    "totalStock": 24379.0,
    "sales": 7772.1000000010245,
    "closingStock": 16606.899999998976,
    "actualDip": 16666.0,
    "variation": 59.100000001024455,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1150340.95,
        "sales": 42.949999999953434
      },
      "mpd1_nz2": {
        "reading": 716547.99,
        "sales": 1229.0100000000093
      },
      "mpd1_nz3": {
        "reading": 1709881.48,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294450.2,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3432346.35,
        "sales": 2494.3400000003166
      },
      "mpd2_nz2": {
        "reading": 4437332.44,
        "sales": 2122.6300000008196
      },
      "mpd3_nz1": {
        "reading": 1435458.21,
        "sales": 1058.7700000000186
      },
      "mpd3_nz2": {
        "reading": 2988769.42,
        "sales": 854.3999999999069
      }
    },
    "totalMeterSales": 7812.1000000010245,
    "pumpTesting": 40.0,
    "netSales": 7772.1000000010245,
    "id": "hsd-3"
  },
  {
    "date": "2026-03-04",
    "openingStock": 16666.0,
    "purchase": 30000.0,
    "totalStock": 46666.0,
    "sales": 9241.049999999348,
    "closingStock": 37424.95000000065,
    "actualDip": 37250.0,
    "variation": -174.95000000065193,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1150424.08,
        "sales": 83.13000000012107
      },
      "mpd1_nz2": {
        "reading": 718241.73,
        "sales": 1693.7399999999907
      },
      "mpd1_nz3": {
        "reading": 1709886.48,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294455.2,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3434992.98,
        "sales": 2646.6299999998882
      },
      "mpd2_nz2": {
        "reading": 4439176.68,
        "sales": 1844.2399999992922
      },
      "mpd3_nz1": {
        "reading": 1436728.12,
        "sales": 1269.910000000149
      },
      "mpd3_nz2": {
        "reading": 2990503.32,
        "sales": 1733.8999999999069
      }
    },
    "totalMeterSales": 9281.549999999348,
    "pumpTesting": 40.5,
    "netSales": 9241.049999999348,
    "id": "hsd-4"
  },
  {
    "date": "2026-03-05",
    "openingStock": 37250.0,
    "purchase": 0.0,
    "totalStock": 37250.0,
    "sales": 12617.310000000289,
    "closingStock": 24632.68999999971,
    "actualDip": 24651.0,
    "variation": 18.31000000028871,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1151107.46,
        "sales": 683.3799999998882
      },
      "mpd1_nz2": {
        "reading": 720878.47,
        "sales": 2636.7399999999907
      },
      "mpd1_nz3": {
        "reading": 1709891.48,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294460.2,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3437757.68,
        "sales": 2764.7000000001863
      },
      "mpd2_nz2": {
        "reading": 4442302.59,
        "sales": 3125.910000000149
      },
      "mpd3_nz1": {
        "reading": 1437730.08,
        "sales": 1001.9599999999627
      },
      "mpd3_nz2": {
        "reading": 2992937.94,
        "sales": 2434.6200000001118
      }
    },
    "totalMeterSales": 12657.310000000289,
    "pumpTesting": 40.0,
    "netSales": 12617.310000000289,
    "id": "hsd-5"
  },
  {
    "date": "2026-03-06",
    "openingStock": 24651.0,
    "purchase": 15000.0,
    "totalStock": 39651.0,
    "sales": 11968.300000000163,
    "closingStock": 27682.699999999837,
    "actualDip": 27645.0,
    "variation": -37.69999999983702,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1151212.19,
        "sales": 104.72999999998137
      },
      "mpd1_nz2": {
        "reading": 724491.65,
        "sales": 3613.180000000051
      },
      "mpd1_nz3": {
        "reading": 1709896.48,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294465.2,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3440620.69,
        "sales": 2863.0099999997765
      },
      "mpd2_nz2": {
        "reading": 4444778.65,
        "sales": 2476.0600000005215
      },
      "mpd3_nz1": {
        "reading": 1438751.84,
        "sales": 1021.7600000000093
      },
      "mpd3_nz2": {
        "reading": 2994919.34,
        "sales": 1981.3999999999069
      }
    },
    "totalMeterSales": 12070.140000000247,
    "pumpTesting": 101.84,
    "netSales": 11968.300000000247,
    "id": "hsd-6"
  },
  {
    "date": "2026-03-07",
    "openingStock": 27645.0,
    "purchase": 15000.0,
    "totalStock": 42645.0,
    "sales": 7628.3699999997625,
    "closingStock": 35016.63000000024,
    "actualDip": 34925.0,
    "variation": -91.63000000023749,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1152369.69,
        "sales": 1157.5
      },
      "mpd1_nz2": {
        "reading": 725541.7,
        "sales": 1050.0499999999302
      },
      "mpd1_nz3": {
        "reading": 1709901.48,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294470.2,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3442235.72,
        "sales": 1615.0300000002608
      },
      "mpd2_nz2": {
        "reading": 4446451.96,
        "sales": 1673.3099999995902
      },
      "mpd3_nz1": {
        "reading": 1439571.93,
        "sales": 820.089999999851
      },
      "mpd3_nz2": {
        "reading": 2996262.23,
        "sales": 1342.8900000001304
      }
    },
    "totalMeterSales": 7668.8699999997625,
    "pumpTesting": 40.5,
    "netSales": 7628.3699999997625,
    "id": "hsd-7"
  },
  {
    "date": "2026-03-08",
    "openingStock": 34925.0,
    "purchase": 0.0,
    "totalStock": 34925.0,
    "sales": 9760.590000000666,
    "closingStock": 25164.409999999334,
    "actualDip": 25305.0,
    "variation": 140.5900000006659,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1153763.52,
        "sales": 1393.8300000000745
      },
      "mpd1_nz2": {
        "reading": 726762.86,
        "sales": 1221.1600000000326
      },
      "mpd1_nz3": {
        "reading": 1709906.48,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294475.2,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3444302.45,
        "sales": 2066.7299999999814
      },
      "mpd2_nz2": {
        "reading": 4449107.15,
        "sales": 2655.19000000041
      },
      "mpd3_nz1": {
        "reading": 1440423.89,
        "sales": 851.9599999999627
      },
      "mpd3_nz2": {
        "reading": 2997863.95,
        "sales": 1601.720000000205
      }
    },
    "totalMeterSales": 9800.590000000666,
    "pumpTesting": 40.0,
    "netSales": 9760.590000000666,
    "id": "hsd-8"
  },
  {
    "date": "2026-03-09",
    "openingStock": 25305.0,
    "purchase": 10000.0,
    "totalStock": 35305.0,
    "sales": 11677.909999999567,
    "closingStock": 23627.090000000433,
    "actualDip": 23614.0,
    "variation": -13.090000000433065,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1155938.86,
        "sales": 2175.340000000084
      },
      "mpd1_nz2": {
        "reading": 728820.54,
        "sales": 2057.680000000051
      },
      "mpd1_nz3": {
        "reading": 1709911.48,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294480.2,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3446227.58,
        "sales": 1925.1299999998882
      },
      "mpd2_nz2": {
        "reading": 4452170.05,
        "sales": 3062.899999999441
      },
      "mpd3_nz1": {
        "reading": 1441202.1,
        "sales": 778.2100000001956
      },
      "mpd3_nz2": {
        "reading": 2999573.1,
        "sales": 1709.1499999999069
      }
    },
    "totalMeterSales": 11718.409999999567,
    "pumpTesting": 40.5,
    "netSales": 11677.909999999567,
    "id": "hsd-9"
  },
  {
    "date": "2026-03-10",
    "openingStock": 23614.0,
    "purchase": 15000.0,
    "totalStock": 38614.0,
    "sales": 11863.439999999711,
    "closingStock": 26750.56000000029,
    "actualDip": 26725.0,
    "variation": -25.56000000028871,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1157321.95,
        "sales": 1383.089999999851
      },
      "mpd1_nz2": {
        "reading": 730595.25,
        "sales": 1774.7099999999627
      },
      "mpd1_nz3": {
        "reading": 1709916.48,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294485.2,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3449107.76,
        "sales": 2880.179999999702
      },
      "mpd2_nz2": {
        "reading": 4454776.19,
        "sales": 2606.140000000596
      },
      "mpd3_nz1": {
        "reading": 1442182.41,
        "sales": 980.309999999823
      },
      "mpd3_nz2": {
        "reading": 3001842.61,
        "sales": 2269.5099999997765
      }
    },
    "totalMeterSales": 11903.939999999711,
    "pumpTesting": 40.5,
    "netSales": 11863.439999999711,
    "id": "hsd-10"
  },
  {
    "date": "2026-03-11",
    "openingStock": 26725.0,
    "purchase": 15000.0,
    "totalStock": 41725.0,
    "sales": 13842.300000000163,
    "closingStock": 27882.699999999837,
    "actualDip": 27867.0,
    "variation": -15.699999999837019,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1159531.46,
        "sales": 2209.5100000000093
      },
      "mpd1_nz2": {
        "reading": 732671.57,
        "sales": 2076.319999999949
      },
      "mpd1_nz3": {
        "reading": 1709921.48,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294490.2,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3451775.96,
        "sales": 2668.2000000001863
      },
      "mpd2_nz2": {
        "reading": 4458622.33,
        "sales": 3846.1399999996647
      },
      "mpd3_nz1": {
        "reading": 1443219.43,
        "sales": 1037.0200000000186
      },
      "mpd3_nz2": {
        "reading": 3003878.22,
        "sales": 2035.6100000003353
      }
    },
    "totalMeterSales": 13882.800000000163,
    "pumpTesting": 40.5,
    "netSales": 13842.300000000163,
    "id": "hsd-11"
  },
  {
    "date": "2026-03-12",
    "openingStock": 27867.0,
    "purchase": 15000.0,
    "totalStock": 42867.0,
    "sales": 11345.710000000196,
    "closingStock": 31521.289999999804,
    "actualDip": 31537.0,
    "variation": 15.710000000195578,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1161091.64,
        "sales": 1560.1799999999348
      },
      "mpd1_nz2": {
        "reading": 734307.32,
        "sales": 1635.75
      },
      "mpd1_nz3": {
        "reading": 1709926.48,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294495.2,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3454619.57,
        "sales": 2843.6099999998696
      },
      "mpd2_nz2": {
        "reading": 4461496.23,
        "sales": 2873.9000000003725
      },
      "mpd3_nz1": {
        "reading": 1444015.82,
        "sales": 796.3900000001304
      },
      "mpd3_nz2": {
        "reading": 3005544.6,
        "sales": 1666.3799999998882
      }
    },
    "totalMeterSales": 11386.210000000196,
    "pumpTesting": 40.5,
    "netSales": 11345.710000000196,
    "id": "hsd-12"
  },
  {
    "date": "2026-03-13",
    "openingStock": 31537.0,
    "purchase": 15000.0,
    "totalStock": 46537.0,
    "sales": 11904.919999999343,
    "closingStock": 34632.08000000066,
    "actualDip": 34563.0,
    "variation": -69.08000000065658,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1162962.14,
        "sales": 1870.5
      },
      "mpd1_nz2": {
        "reading": 735597.78,
        "sales": 1290.4600000000792
      },
      "mpd1_nz3": {
        "reading": 1709931.48,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294500.2,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3457332.26,
        "sales": 2712.689999999944
      },
      "mpd2_nz2": {
        "reading": 4464611.41,
        "sales": 3115.179999999702
      },
      "mpd3_nz1": {
        "reading": 1445092.5,
        "sales": 1076.6799999999348
      },
      "mpd3_nz2": {
        "reading": 3007414.51,
        "sales": 1869.9099999996834
      }
    },
    "totalMeterSales": 11945.419999999343,
    "pumpTesting": 40.5,
    "netSales": 11904.919999999343,
    "id": "hsd-13"
  },
  {
    "date": "2026-03-14",
    "openingStock": 34563.0,
    "purchase": 0.0,
    "totalStock": 34563.0,
    "sales": 9453.73000000033,
    "closingStock": 25109.26999999967,
    "actualDip": 25123.0,
    "variation": 13.73000000033062,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1164584.36,
        "sales": 1622.220000000205
      },
      "mpd1_nz2": {
        "reading": 736902.08,
        "sales": 1304.2999999999302
      },
      "mpd1_nz3": {
        "reading": 1709936.48,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294505.2,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3459944.34,
        "sales": 2612.0800000000745
      },
      "mpd2_nz2": {
        "reading": 4466766.36,
        "sales": 2154.9500000001863
      },
      "mpd3_nz1": {
        "reading": 1445904.16,
        "sales": 811.6599999999162
      },
      "mpd3_nz2": {
        "reading": 3008393.03,
        "sales": 978.5200000000186
      }
    },
    "totalMeterSales": 9493.73000000033,
    "pumpTesting": 40.0,
    "netSales": 9453.73000000033,
    "id": "hsd-14"
  },
  {
    "date": "2026-03-15",
    "openingStock": 25123.0,
    "purchase": 15000.0,
    "totalStock": 40123.0,
    "sales": 11710.410000000265,
    "closingStock": 28412.589999999735,
    "actualDip": 28338.0,
    "variation": -74.58999999973457,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1166264.8,
        "sales": 1680.4399999999441
      },
      "mpd1_nz2": {
        "reading": 738858.31,
        "sales": 1956.2300000000978
      },
      "mpd1_nz3": {
        "reading": 1709941.48,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294510.2,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3462140.46,
        "sales": 2196.1200000001118
      },
      "mpd2_nz2": {
        "reading": 4469407.12,
        "sales": 2640.7599999997765
      },
      "mpd3_nz1": {
        "reading": 1447123.86,
        "sales": 1219.7000000001863
      },
      "mpd3_nz2": {
        "reading": 3010440.69,
        "sales": 2047.660000000149
      }
    },
    "totalMeterSales": 11750.910000000265,
    "pumpTesting": 40.5,
    "netSales": 11710.410000000265,
    "id": "hsd-15"
  },
  {
    "date": "2026-03-16",
    "openingStock": 28338.0,
    "purchase": 0.0,
    "totalStock": 28338.0,
    "sales": 13066.29999999958,
    "closingStock": 15271.70000000042,
    "actualDip": 15448.0,
    "variation": 176.2999999995809,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1168804.3,
        "sales": 2539.5
      },
      "mpd1_nz2": {
        "reading": 741684.49,
        "sales": 2826.179999999935
      },
      "mpd1_nz3": {
        "reading": 1709951.96,
        "sales": 10.479999999981374
      },
      "mpd1_nz4": {
        "reading": 2294520.68,
        "sales": 10.479999999981374
      },
      "mpd2_nz1": {
        "reading": 3465132.7,
        "sales": 2992.2400000002235
      },
      "mpd2_nz2": {
        "reading": 4471654.34,
        "sales": 2247.2199999997392
      },
      "mpd3_nz1": {
        "reading": 1447848.72,
        "sales": 724.8599999998696
      },
      "mpd3_nz2": {
        "reading": 3012196.03,
        "sales": 1755.339999999851
      }
    },
    "totalMeterSales": 13106.29999999958,
    "pumpTesting": 40.0,
    "netSales": 13066.29999999958,
    "id": "hsd-16"
  },
  {
    "date": "2026-03-17",
    "openingStock": 15448.0,
    "purchase": 15000.0,
    "totalStock": 30448.0,
    "sales": 10208.14000000048,
    "closingStock": 20239.85999999952,
    "actualDip": 20144.0,
    "variation": -95.85999999952037,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1170240.36,
        "sales": 1436.0600000000559
      },
      "mpd1_nz2": {
        "reading": 743472.11,
        "sales": 1787.6199999999953
      },
      "mpd1_nz3": {
        "reading": 1709956.96,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294525.68,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3466903.99,
        "sales": 1771.2900000000373
      },
      "mpd2_nz2": {
        "reading": 4474504.0,
        "sales": 2849.660000000149
      },
      "mpd3_nz1": {
        "reading": 1448588.68,
        "sales": 739.9599999999627
      },
      "mpd3_nz2": {
        "reading": 3013860.08,
        "sales": 1664.0500000002794
      }
    },
    "totalMeterSales": 10258.64000000048,
    "pumpTesting": 50.5,
    "netSales": 10208.14000000048,
    "id": "hsd-17"
  },
  {
    "date": "2026-03-18",
    "openingStock": 20144.0,
    "purchase": 30000.0,
    "totalStock": 50144.0,
    "sales": 14052.289999999222,
    "closingStock": 36091.71000000078,
    "actualDip": 35912.0,
    "variation": -179.71000000077765,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1171687.77,
        "sales": 1447.4099999999162
      },
      "mpd1_nz2": {
        "reading": 745813.55,
        "sales": 2341.4400000000605
      },
      "mpd1_nz3": {
        "reading": 1709961.97,
        "sales": 5.010000000009313
      },
      "mpd1_nz4": {
        "reading": 2294536.16,
        "sales": 10.479999999981374
      },
      "mpd2_nz1": {
        "reading": 3469687.57,
        "sales": 2783.579999999609
      },
      "mpd2_nz2": {
        "reading": 4478733.64,
        "sales": 4229.639999999665
      },
      "mpd3_nz1": {
        "reading": 1449463.2,
        "sales": 874.5200000000186
      },
      "mpd3_nz2": {
        "reading": 3016260.79,
        "sales": 2400.7099999999627
      }
    },
    "totalMeterSales": 14092.789999999222,
    "pumpTesting": 40.5,
    "netSales": 14052.289999999222,
    "id": "hsd-18"
  },
  {
    "date": "2026-03-19",
    "openingStock": 35912.0,
    "purchase": 0.0,
    "totalStock": 35912.0,
    "sales": 10591.850000000792,
    "closingStock": 25320.14999999921,
    "actualDip": 25259.0,
    "variation": -61.149999999208376,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1172822.84,
        "sales": 1135.0700000000652
      },
      "mpd1_nz2": {
        "reading": 747121.28,
        "sales": 1307.7299999999814
      },
      "mpd1_nz3": {
        "reading": 1709966.97,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294541.16,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3472275.31,
        "sales": 2587.7400000002235
      },
      "mpd2_nz2": {
        "reading": 4481663.78,
        "sales": 2930.140000000596
      },
      "mpd3_nz1": {
        "reading": 1450374.11,
        "sales": 910.910000000149
      },
      "mpd3_nz2": {
        "reading": 3018015.44,
        "sales": 1754.6499999999069
      }
    },
    "totalMeterSales": 10636.240000000922,
    "pumpTesting": 44.39,
    "netSales": 10591.850000000923,
    "id": "hsd-19"
  },
  {
    "date": "2026-03-20",
    "openingStock": 25259.0,
    "purchase": 15000.0,
    "totalStock": 40259.0,
    "sales": 12124.939999999828,
    "closingStock": 28134.060000000172,
    "actualDip": 28094.0,
    "variation": -40.060000000172295,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1174370.06,
        "sales": 1547.219999999972
      },
      "mpd1_nz2": {
        "reading": 748612.88,
        "sales": 1491.5999999999767
      },
      "mpd1_nz3": {
        "reading": 1709971.97,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294579.08,
        "sales": 37.919999999925494
      },
      "mpd2_nz1": {
        "reading": 3475000.34,
        "sales": 2725.029999999795
      },
      "mpd2_nz2": {
        "reading": 4485209.82,
        "sales": 3546.0400000000373
      },
      "mpd3_nz1": {
        "reading": 1451147.48,
        "sales": 773.3699999998789
      },
      "mpd3_nz2": {
        "reading": 3020054.7,
        "sales": 2039.2600000002421
      }
    },
    "totalMeterSales": 12165.439999999828,
    "pumpTesting": 40.5,
    "netSales": 12124.939999999828,
    "id": "hsd-20"
  },
  {
    "date": "2026-03-21",
    "openingStock": 28094.0,
    "purchase": 15000.0,
    "totalStock": 43094.0,
    "sales": 11617.139999999548,
    "closingStock": 31476.86000000045,
    "actualDip": 31471.0,
    "variation": -5.8600000004516914,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1177487.45,
        "sales": 3117.3899999998976
      },
      "mpd1_nz2": {
        "reading": 751024.75,
        "sales": 2411.8699999999953
      },
      "mpd1_nz3": {
        "reading": 1709976.97,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294584.08,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3477234.96,
        "sales": 2234.6200000001118
      },
      "mpd2_nz2": {
        "reading": 4486952.24,
        "sales": 1742.4199999999255
      },
      "mpd3_nz1": {
        "reading": 1451923.47,
        "sales": 775.9899999999907
      },
      "mpd3_nz2": {
        "reading": 3021420.05,
        "sales": 1365.3499999996275
      }
    },
    "totalMeterSales": 11657.639999999548,
    "pumpTesting": 40.5,
    "netSales": 11617.139999999548,
    "id": "hsd-21"
  },
  {
    "date": "2026-03-22",
    "openingStock": 31471.0,
    "purchase": 0.0,
    "totalStock": 31471.0,
    "sales": 13119.290000000386,
    "closingStock": 18351.709999999614,
    "actualDip": 18405.0,
    "variation": 53.2900000003865,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1180354.65,
        "sales": 2867.1999999999534
      },
      "mpd1_nz2": {
        "reading": 753705.62,
        "sales": 2680.8699999999953
      },
      "mpd1_nz3": {
        "reading": 1709981.97,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294589.08,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3479075.18,
        "sales": 1840.220000000205
      },
      "mpd2_nz2": {
        "reading": 4490231.73,
        "sales": 3279.4900000002235
      },
      "mpd3_nz1": {
        "reading": 1452694.52,
        "sales": 771.0500000000466
      },
      "mpd3_nz2": {
        "reading": 3023130.51,
        "sales": 1710.4599999999627
      }
    },
    "totalMeterSales": 13159.290000000386,
    "pumpTesting": 40.0,
    "netSales": 13119.290000000386,
    "id": "hsd-22"
  },
  {
    "date": "2026-03-23",
    "openingStock": 18405.0,
    "purchase": 15000.0,
    "totalStock": 33405.0,
    "sales": 20660.3899999992,
    "closingStock": 12744.610000000801,
    "actualDip": 12914.0,
    "variation": 169.38999999919906,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1185457.46,
        "sales": 5102.810000000056
      },
      "mpd1_nz2": {
        "reading": 759217.83,
        "sales": 5512.209999999963
      },
      "mpd1_nz3": {
        "reading": 1709986.97,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294594.08,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3481267.63,
        "sales": 2192.4499999997206
      },
      "mpd2_nz2": {
        "reading": 4494468.71,
        "sales": 4236.979999999516
      },
      "mpd3_nz1": {
        "reading": 1453881.44,
        "sales": 1186.9199999999255
      },
      "mpd3_nz2": {
        "reading": 3025590.03,
        "sales": 2459.5200000000186
      }
    },
    "totalMeterSales": 20700.8899999992,
    "pumpTesting": 40.5,
    "netSales": 20660.3899999992,
    "id": "hsd-23"
  },
  {
    "date": "2026-03-24",
    "openingStock": 12914.0,
    "purchase": 15000.0,
    "totalStock": 27914.0,
    "sales": 18175.23999999999,
    "closingStock": 9738.76000000001,
    "actualDip": 9861.0,
    "variation": 122.23999999999069,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1189714.49,
        "sales": 4257.030000000028
      },
      "mpd1_nz2": {
        "reading": 763603.38,
        "sales": 4385.550000000047
      },
      "mpd1_nz3": {
        "reading": 1709991.97,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294599.08,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3483569.69,
        "sales": 2302.060000000056
      },
      "mpd2_nz2": {
        "reading": 4498025.31,
        "sales": 3556.5999999996275
      },
      "mpd3_nz1": {
        "reading": 1455095.51,
        "sales": 1214.0700000000652
      },
      "mpd3_nz2": {
        "reading": 3028080.46,
        "sales": 2490.4300000001676
      }
    },
    "totalMeterSales": 18215.73999999999,
    "pumpTesting": 40.5,
    "netSales": 18175.23999999999,
    "id": "hsd-24"
  },
  {
    "date": "2026-03-25",
    "openingStock": 9861.0,
    "purchase": 15000.0,
    "totalStock": 24861.0,
    "sales": 14201.100000000559,
    "closingStock": 10659.899999999441,
    "actualDip": 10616.0,
    "variation": -43.89999999944121,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1193706.77,
        "sales": 3992.280000000028
      },
      "mpd1_nz2": {
        "reading": 767825.14,
        "sales": 4221.760000000009
      },
      "mpd1_nz3": {
        "reading": 1709996.97,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294612.33,
        "sales": 13.25
      },
      "mpd2_nz1": {
        "reading": 3484978.97,
        "sales": 1409.2800000002608
      },
      "mpd2_nz2": {
        "reading": 4500648.67,
        "sales": 2623.3600000003353
      },
      "mpd3_nz1": {
        "reading": 1455339.05,
        "sales": 243.54000000003725
      },
      "mpd3_nz2": {
        "reading": 3029813.09,
        "sales": 1732.6299999998882
      }
    },
    "totalMeterSales": 14241.100000000559,
    "pumpTesting": 40.0,
    "netSales": 14201.100000000559,
    "id": "hsd-25"
  },
  {
    "date": "2026-03-26",
    "openingStock": 10616.0,
    "purchase": 15000.0,
    "totalStock": 25616.0,
    "sales": 17394.430000000168,
    "closingStock": 8221.569999999832,
    "actualDip": 8255.0,
    "variation": 33.43000000016764,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1197217.99,
        "sales": 3511.219999999972
      },
      "mpd1_nz2": {
        "reading": 772043.42,
        "sales": 4218.280000000028
      },
      "mpd1_nz3": {
        "reading": 1710001.97,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2294617.33,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3487205.99,
        "sales": 2227.0200000000186
      },
      "mpd2_nz2": {
        "reading": 4502827.63,
        "sales": 2178.9599999999627
      },
      "mpd3_nz1": {
        "reading": 1456480.74,
        "sales": 1141.6899999999441
      },
      "mpd3_nz2": {
        "reading": 3033960.35,
        "sales": 4147.260000000242
      }
    },
    "totalMeterSales": 17434.430000000168,
    "pumpTesting": 40.0,
    "netSales": 17394.430000000168,
    "id": "hsd-26"
  },
  {
    "date": "2026-03-27",
    "openingStock": 8255.0,
    "purchase": 15000.0,
    "totalStock": 23255.0,
    "sales": 17582.61999999918,
    "closingStock": 5672.38000000082,
    "actualDip": 5758.0,
    "variation": 85.61999999918044,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1198109.44,
        "sales": 891.4499999999534
      },
      "mpd1_nz2": {
        "reading": 778761.09,
        "sales": 6717.6699999999255
      },
      "mpd1_nz3": {
        "reading": 1711503.87,
        "sales": 1501.9000000001397
      },
      "mpd1_nz4": {
        "reading": 2294641.36,
        "sales": 24.02999999979511
      },
      "mpd2_nz1": {
        "reading": 3489786.26,
        "sales": 2580.269999999553
      },
      "mpd2_nz2": {
        "reading": 4505177.21,
        "sales": 2349.5800000000745
      },
      "mpd3_nz1": {
        "reading": 1458353.74,
        "sales": 1873.0
      },
      "mpd3_nz2": {
        "reading": 3035667.09,
        "sales": 1706.7399999997579
      }
    },
    "totalMeterSales": 17644.6399999992,
    "pumpTesting": 62.019999999999996,
    "netSales": 17582.6199999992,
    "id": "hsd-27"
  },
  {
    "date": "2026-03-28",
    "openingStock": 5758.0,
    "purchase": 30000.0,
    "totalStock": 35758.0,
    "sales": 6835.250000000466,
    "closingStock": 28922.749999999534,
    "actualDip": 28340.0,
    "variation": -582.7499999995343,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1198569.2,
        "sales": 459.7600000000093
      },
      "mpd1_nz2": {
        "reading": 779266.09,
        "sales": 505.0
      },
      "mpd1_nz3": {
        "reading": 1712447.55,
        "sales": 943.6799999999348
      },
      "mpd1_nz4": {
        "reading": 2296101.22,
        "sales": 1459.8600000003353
      },
      "mpd2_nz1": {
        "reading": 3490927.62,
        "sales": 1141.3600000003353
      },
      "mpd2_nz2": {
        "reading": 4506339.14,
        "sales": 1161.929999999702
      },
      "mpd3_nz1": {
        "reading": 1458806.36,
        "sales": 452.62000000011176
      },
      "mpd3_nz2": {
        "reading": 3036441.11,
        "sales": 774.0200000000186
      }
    },
    "totalMeterSales": 6898.230000000447,
    "pumpTesting": 62.980000000000004,
    "netSales": 6835.2500000004475,
    "id": "hsd-28"
  },
  {
    "date": "2026-03-29",
    "openingStock": 28340.0,
    "purchase": 0.0,
    "totalStock": 28340.0,
    "sales": 10919.320000000764,
    "closingStock": 17420.679999999236,
    "actualDip": 17521.0,
    "variation": 100.32000000076368,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1198845.22,
        "sales": 276.0200000000186
      },
      "mpd1_nz2": {
        "reading": 781924.14,
        "sales": 2658.0500000000466
      },
      "mpd1_nz3": {
        "reading": 1713454.7,
        "sales": 1007.1499999999069
      },
      "mpd1_nz4": {
        "reading": 2296106.22,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3493423.7,
        "sales": 2496.0800000000745
      },
      "mpd2_nz2": {
        "reading": 4508634.65,
        "sales": 2295.510000000708
      },
      "mpd3_nz1": {
        "reading": 1459662.87,
        "sales": 856.5100000000093
      },
      "mpd3_nz2": {
        "reading": 3037806.11,
        "sales": 1365.0
      }
    },
    "totalMeterSales": 10959.320000000764,
    "pumpTesting": 40.0,
    "netSales": 10919.320000000764,
    "id": "hsd-29"
  },
  {
    "date": "2026-03-30",
    "openingStock": 17521.0,
    "purchase": 15000.0,
    "totalStock": 32521.0,
    "sales": 7897.389999999199,
    "closingStock": 24623.6100000008,
    "actualDip": 24469.0,
    "variation": -154.61000000080094,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1198850.23,
        "sales": 5.010000000009313
      },
      "mpd1_nz2": {
        "reading": 783566.33,
        "sales": 1642.1899999999441
      },
      "mpd1_nz3": {
        "reading": 1713459.7,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2296111.22,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3495228.72,
        "sales": 1805.0200000000186
      },
      "mpd2_nz2": {
        "reading": 4510584.89,
        "sales": 1950.2399999992922
      },
      "mpd3_nz1": {
        "reading": 1460518.03,
        "sales": 855.1599999999162
      },
      "mpd3_nz2": {
        "reading": 3039476.38,
        "sales": 1670.2700000000186
      }
    },
    "totalMeterSales": 7937.889999999199,
    "pumpTesting": 40.5,
    "netSales": 7897.389999999199,
    "id": "hsd-30"
  },
  {
    "date": "2026-03-31",
    "openingStock": 24469.0,
    "purchase": 15000.0,
    "totalStock": 39469.0,
    "sales": 8378.310000000172,
    "closingStock": 31090.689999999828,
    "actualDip": 31009.0,
    "variation": -81.6899999998277,
    "nozzles": {
      "mpd1_nz1": {
        "reading": 1198855.23,
        "sales": 5.0
      },
      "mpd1_nz2": {
        "reading": 785737.54,
        "sales": 2171.210000000079
      },
      "mpd1_nz3": {
        "reading": 1713464.7,
        "sales": 5.0
      },
      "mpd1_nz4": {
        "reading": 2296116.22,
        "sales": 5.0
      },
      "mpd2_nz1": {
        "reading": 3497003.72,
        "sales": 1775.0
      },
      "mpd2_nz2": {
        "reading": 4512956.8,
        "sales": 2371.910000000149
      },
      "mpd3_nz1": {
        "reading": 1461177.8,
        "sales": 659.7700000000186
      },
      "mpd3_nz2": {
        "reading": 3040902.3,
        "sales": 1425.9199999999255
      }
    },
    "totalMeterSales": 8418.810000000172,
    "pumpTesting": 40.5,
    "netSales": 8378.310000000172,
    "id": "hsd-31"
  }
];

export const PETROL_DSR_DATA: DsrRecord[] = [
  {
    "date": "2026-03-01",
    "openingStock": 10177.79,
    "purchase": 0.0,
    "totalStock": 10177.79,
    "sales": 4617.129999999888,
    "closingStock": 5560.660000000113,
    "actualDip": 5571.0,
    "variation": 10.339999999887368,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1913661.15,
        "sales": 1451.4799999999814
      },
      "mpd2_nz4": {
        "reading": 793516.14,
        "sales": 525.7099999999627
      },
      "mpd3_nz3": {
        "reading": 2751791.81,
        "sales": 2255.2700000000186
      },
      "mpd3_nz4": {
        "reading": 657872.33,
        "sales": 404.6699999999255
      }
    },
    "totalMeterSales": 4637.129999999888,
    "pumpTesting": 20.0,
    "netSales": 4617.129999999888,
    "id": "petrol-1"
  },
  {
    "date": "2026-03-02",
    "openingStock": 5571.0,
    "purchase": 5000.0,
    "totalStock": 10571.0,
    "sales": 3136.6300000002375,
    "closingStock": 7434.3699999997625,
    "actualDip": 7428.0,
    "variation": -6.369999999762513,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1914551.03,
        "sales": 889.8800000001211
      },
      "mpd2_nz4": {
        "reading": 793991.92,
        "sales": 475.78000000002794
      },
      "mpd3_nz3": {
        "reading": 2753261.58,
        "sales": 1469.7700000000186
      },
      "mpd3_nz4": {
        "reading": 658194.03,
        "sales": 321.70000000006985
      }
    },
    "totalMeterSales": 3157.1300000002375,
    "pumpTesting": 20.5,
    "netSales": 3136.6300000002375,
    "id": "petrol-2"
  },
  {
    "date": "2026-03-03",
    "openingStock": 7428.0,
    "purchase": 0.0,
    "totalStock": 7428.0,
    "sales": 2981.8799999998882,
    "closingStock": 4446.120000000112,
    "actualDip": 4451.37,
    "variation": 5.249999999888132,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1915336.64,
        "sales": 785.6099999998696
      },
      "mpd2_nz4": {
        "reading": 794543.61,
        "sales": 551.6899999999441
      },
      "mpd3_nz3": {
        "reading": 2754645.47,
        "sales": 1383.8900000001304
      },
      "mpd3_nz4": {
        "reading": 658474.72,
        "sales": 280.6899999999441
      }
    },
    "totalMeterSales": 3001.8799999998882,
    "pumpTesting": 20.0,
    "netSales": 2981.8799999998882,
    "id": "petrol-3"
  },
  {
    "date": "2026-03-04",
    "openingStock": 4451.37,
    "purchase": 10000.0,
    "totalStock": 14451.369999999999,
    "sales": 3639.230000000098,
    "closingStock": 10812.139999999901,
    "actualDip": 10777.0,
    "variation": -35.13999999990119,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1916363.01,
        "sales": 1026.3700000001118
      },
      "mpd2_nz4": {
        "reading": 794992.31,
        "sales": 448.70000000006985
      },
      "mpd3_nz3": {
        "reading": 2756530.66,
        "sales": 1885.1899999999441
      },
      "mpd3_nz4": {
        "reading": 658774.19,
        "sales": 299.46999999997206
      }
    },
    "totalMeterSales": 3659.730000000098,
    "pumpTesting": 20.5,
    "netSales": 3639.230000000098,
    "id": "petrol-4"
  },
  {
    "date": "2026-03-05",
    "openingStock": 10777.0,
    "purchase": 0.0,
    "totalStock": 10777.0,
    "sales": 3738.3299999998417,
    "closingStock": 7038.670000000158,
    "actualDip": 7053.66,
    "variation": 14.98999999984153,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1917501.86,
        "sales": 1138.8500000000931
      },
      "mpd2_nz4": {
        "reading": 795318.85,
        "sales": 326.53999999992084
      },
      "mpd3_nz3": {
        "reading": 2758345.63,
        "sales": 1814.9699999997392
      },
      "mpd3_nz4": {
        "reading": 659252.16,
        "sales": 477.9700000000885
      }
    },
    "totalMeterSales": 3758.3299999998417,
    "pumpTesting": 20.0,
    "netSales": 3738.3299999998417,
    "id": "petrol-5"
  },
  {
    "date": "2026-03-06",
    "openingStock": 7053.66,
    "purchase": 5000.0,
    "totalStock": 12053.66,
    "sales": 3460.769999999902,
    "closingStock": 8592.890000000098,
    "actualDip": 8585.0,
    "variation": -7.890000000097643,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1918554.93,
        "sales": 1053.0699999998324
      },
      "mpd2_nz4": {
        "reading": 795578.62,
        "sales": 259.7700000000186
      },
      "mpd3_nz3": {
        "reading": 2760015.69,
        "sales": 1670.0600000000559
      },
      "mpd3_nz4": {
        "reading": 659750.53,
        "sales": 498.36999999999534
      }
    },
    "totalMeterSales": 3481.269999999902,
    "pumpTesting": 20.5,
    "netSales": 3460.769999999902,
    "id": "petrol-6"
  },
  {
    "date": "2026-03-07",
    "openingStock": 8585.0,
    "purchase": 5000.0,
    "totalStock": 13585.0,
    "sales": 4347.520000000368,
    "closingStock": 9237.479999999632,
    "actualDip": 9256.72,
    "variation": 19.240000000367218,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1919925.61,
        "sales": 1370.6800000001676
      },
      "mpd2_nz4": {
        "reading": 795956.0,
        "sales": 377.38000000000466
      },
      "mpd3_nz3": {
        "reading": 2762088.66,
        "sales": 2072.970000000205
      },
      "mpd3_nz4": {
        "reading": 660297.52,
        "sales": 546.9899999999907
      }
    },
    "totalMeterSales": 4368.020000000368,
    "pumpTesting": 20.5,
    "netSales": 4347.520000000368,
    "id": "petrol-7"
  },
  {
    "date": "2026-03-08",
    "openingStock": 9256.72,
    "purchase": 0.0,
    "totalStock": 9256.72,
    "sales": 4025.8499999999767,
    "closingStock": 5230.870000000023,
    "actualDip": 5240.0,
    "variation": 9.129999999977372,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1921064.61,
        "sales": 1139.0
      },
      "mpd2_nz4": {
        "reading": 796318.63,
        "sales": 362.63000000000466
      },
      "mpd3_nz3": {
        "reading": 2764141.89,
        "sales": 2053.2299999999814
      },
      "mpd3_nz4": {
        "reading": 660788.51,
        "sales": 490.9899999999907
      }
    },
    "totalMeterSales": 4045.8499999999767,
    "pumpTesting": 20.0,
    "netSales": 4025.8499999999767,
    "id": "petrol-8"
  },
  {
    "date": "2026-03-09",
    "openingStock": 5240.0,
    "purchase": 10000.0,
    "totalStock": 15240.0,
    "sales": 3332.479999999632,
    "closingStock": 11907.520000000368,
    "actualDip": 11879.25,
    "variation": -28.270000000367872,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1922333.0,
        "sales": 1268.3899999998976
      },
      "mpd2_nz4": {
        "reading": 796643.55,
        "sales": 324.9200000000419
      },
      "mpd3_nz3": {
        "reading": 2765654.01,
        "sales": 1512.119999999646
      },
      "mpd3_nz4": {
        "reading": 661036.06,
        "sales": 247.55000000004657
      }
    },
    "totalMeterSales": 3352.979999999632,
    "pumpTesting": 20.5,
    "netSales": 3332.479999999632,
    "id": "petrol-9"
  },
  {
    "date": "2026-03-10",
    "openingStock": 11879.25,
    "purchase": 5000.0,
    "totalStock": 16879.25,
    "sales": 3456.1100000003353,
    "closingStock": 13423.139999999665,
    "actualDip": 13432.0,
    "variation": 8.860000000335276,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1923518.35,
        "sales": 1185.3500000000931
      },
      "mpd2_nz4": {
        "reading": 796907.37,
        "sales": 263.8199999999488
      },
      "mpd3_nz3": {
        "reading": 2767313.64,
        "sales": 1659.630000000354
      },
      "mpd3_nz4": {
        "reading": 661403.87,
        "sales": 367.80999999993946
      }
    },
    "totalMeterSales": 3476.6100000003353,
    "pumpTesting": 20.5,
    "netSales": 3456.1100000003353,
    "id": "petrol-10"
  },
  {
    "date": "2026-03-11",
    "openingStock": 13432.0,
    "purchase": 5000.0,
    "totalStock": 18432.0,
    "sales": 3741.699999999837,
    "closingStock": 14690.300000000163,
    "actualDip": 14693.41,
    "variation": 3.109999999836873,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1924765.3,
        "sales": 1246.9499999999534
      },
      "mpd2_nz4": {
        "reading": 797321.48,
        "sales": 414.10999999998603
      },
      "mpd3_nz3": {
        "reading": 2769001.06,
        "sales": 1687.4199999999255
      },
      "mpd3_nz4": {
        "reading": 661817.59,
        "sales": 413.71999999997206
      }
    },
    "totalMeterSales": 3762.199999999837,
    "pumpTesting": 20.5,
    "netSales": 3741.699999999837,
    "id": "petrol-11"
  },
  {
    "date": "2026-03-12",
    "openingStock": 14693.41,
    "purchase": 5000.0,
    "totalStock": 19693.41,
    "sales": 3858.95999999973,
    "closingStock": 15834.45000000027,
    "actualDip": 15830.0,
    "variation": -4.450000000269938,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1925863.81,
        "sales": 1098.5100000000093
      },
      "mpd2_nz4": {
        "reading": 797741.57,
        "sales": 420.0899999999674
      },
      "mpd3_nz3": {
        "reading": 2770926.01,
        "sales": 1924.9499999997206
      },
      "mpd3_nz4": {
        "reading": 662253.5,
        "sales": 435.9100000000326
      }
    },
    "totalMeterSales": 3879.45999999973,
    "pumpTesting": 20.5,
    "netSales": 3858.95999999973,
    "id": "petrol-12"
  },
  {
    "date": "2026-03-13",
    "openingStock": 15830.0,
    "purchase": 5000.0,
    "totalStock": 20830.0,
    "sales": 3815.5000000001164,
    "closingStock": 17014.499999999884,
    "actualDip": 17029.0,
    "variation": 14.500000000116415,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1926988.28,
        "sales": 1124.469999999972
      },
      "mpd2_nz4": {
        "reading": 798098.89,
        "sales": 357.3200000000652
      },
      "mpd3_nz3": {
        "reading": 2772856.34,
        "sales": 1930.3300000000745
      },
      "mpd3_nz4": {
        "reading": 662677.38,
        "sales": 423.88000000000466
      }
    },
    "totalMeterSales": 3836.0000000001164,
    "pumpTesting": 20.5,
    "netSales": 3815.5000000001164,
    "id": "petrol-13"
  },
  {
    "date": "2026-03-14",
    "openingStock": 17029.0,
    "purchase": 0.0,
    "totalStock": 17029.0,
    "sales": 4819.389999999898,
    "closingStock": 12209.610000000102,
    "actualDip": 12172.0,
    "variation": -37.610000000102445,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1928883.67,
        "sales": 1895.3899999998976
      },
      "mpd2_nz4": {
        "reading": 798610.98,
        "sales": 512.0899999999674
      },
      "mpd3_nz3": {
        "reading": 2774856.63,
        "sales": 2000.2900000000373
      },
      "mpd3_nz4": {
        "reading": 663109.0,
        "sales": 431.61999999999534
      }
    },
    "totalMeterSales": 4839.389999999898,
    "pumpTesting": 20.0,
    "netSales": 4819.389999999898,
    "id": "petrol-14"
  },
  {
    "date": "2026-03-15",
    "openingStock": 12172.0,
    "purchase": 5000.0,
    "totalStock": 17172.0,
    "sales": 5074.540000000154,
    "closingStock": 12097.459999999846,
    "actualDip": 12086.0,
    "variation": -11.459999999846332,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1930827.12,
        "sales": 1943.4500000001863
      },
      "mpd2_nz4": {
        "reading": 799158.08,
        "sales": 547.0999999999767
      },
      "mpd3_nz3": {
        "reading": 2776845.88,
        "sales": 1989.25
      },
      "mpd3_nz4": {
        "reading": 663724.24,
        "sales": 615.2399999999907
      }
    },
    "totalMeterSales": 5095.040000000154,
    "pumpTesting": 20.5,
    "netSales": 5074.540000000154,
    "id": "petrol-15"
  },
  {
    "date": "2026-03-16",
    "openingStock": 12086.0,
    "purchase": 0.0,
    "totalStock": 12086.0,
    "sales": 4649.920000000158,
    "closingStock": 7436.079999999842,
    "actualDip": 7452.0,
    "variation": 15.920000000158325,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1932168.65,
        "sales": 1341.529999999795
      },
      "mpd2_nz4": {
        "reading": 799622.27,
        "sales": 464.19000000006054
      },
      "mpd3_nz3": {
        "reading": 2779092.16,
        "sales": 2246.2800000002608
      },
      "mpd3_nz4": {
        "reading": 664342.16,
        "sales": 617.9200000000419
      }
    },
    "totalMeterSales": 4669.920000000158,
    "pumpTesting": 20.0,
    "netSales": 4649.920000000158,
    "id": "petrol-16"
  },
  {
    "date": "2026-03-17",
    "openingStock": 7452.0,
    "purchase": 5000.0,
    "totalStock": 12452.0,
    "sales": 3935.5399999998044,
    "closingStock": 8516.460000000196,
    "actualDip": 8537.0,
    "variation": 20.539999999804422,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1933321.39,
        "sales": 1152.7399999999907
      },
      "mpd2_nz4": {
        "reading": 799965.57,
        "sales": 343.29999999993015
      },
      "mpd3_nz3": {
        "reading": 2781071.35,
        "sales": 1979.1899999999441
      },
      "mpd3_nz4": {
        "reading": 664822.97,
        "sales": 480.80999999993946
      }
    },
    "totalMeterSales": 3956.0399999998044,
    "pumpTesting": 20.5,
    "netSales": 3935.5399999998044,
    "id": "petrol-17"
  },
  {
    "date": "2026-03-18",
    "openingStock": 8537.0,
    "purchase": 10000.0,
    "totalStock": 18537.0,
    "sales": 3446.2100000001956,
    "closingStock": 15090.789999999804,
    "actualDip": 15101.0,
    "variation": 10.210000000195578,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1934451.55,
        "sales": 1130.160000000149
      },
      "mpd2_nz4": {
        "reading": 800267.54,
        "sales": 301.9700000000885
      },
      "mpd3_nz3": {
        "reading": 2782709.23,
        "sales": 1637.8799999998882
      },
      "mpd3_nz4": {
        "reading": 665219.67,
        "sales": 396.70000000006985
      }
    },
    "totalMeterSales": 3466.7100000001956,
    "pumpTesting": 20.5,
    "netSales": 3446.2100000001956,
    "id": "petrol-18"
  },
  {
    "date": "2026-03-19",
    "openingStock": 15101.0,
    "purchase": 0.0,
    "totalStock": 15101.0,
    "sales": 3695.039999999688,
    "closingStock": 11405.960000000312,
    "actualDip": 11381.0,
    "variation": -24.960000000311993,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1935850.73,
        "sales": 1399.1799999999348
      },
      "mpd2_nz4": {
        "reading": 800622.34,
        "sales": 354.79999999993015
      },
      "mpd3_nz3": {
        "reading": 2784297.36,
        "sales": 1588.1299999998882
      },
      "mpd3_nz4": {
        "reading": 665592.6,
        "sales": 372.9299999999348
      }
    },
    "totalMeterSales": 3715.039999999688,
    "pumpTesting": 20.0,
    "netSales": 3695.039999999688,
    "id": "petrol-19"
  },
  {
    "date": "2026-03-20",
    "openingStock": 11381.0,
    "purchase": 5000.0,
    "totalStock": 16381.0,
    "sales": 4691.670000000158,
    "closingStock": 11689.329999999842,
    "actualDip": 11671.0,
    "variation": -18.329999999841675,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1937570.36,
        "sales": 1719.630000000121
      },
      "mpd2_nz4": {
        "reading": 800986.98,
        "sales": 364.64000000001397
      },
      "mpd3_nz3": {
        "reading": 2786426.61,
        "sales": 2129.25
      },
      "mpd3_nz4": {
        "reading": 666091.25,
        "sales": 498.6500000000233
      }
    },
    "totalMeterSales": 4712.170000000158,
    "pumpTesting": 20.5,
    "netSales": 4691.670000000158,
    "id": "petrol-20"
  },
  {
    "date": "2026-03-21",
    "openingStock": 11671.0,
    "purchase": 5000.0,
    "totalStock": 16671.0,
    "sales": 4605.8400000002,
    "closingStock": 12065.1599999998,
    "actualDip": 12067.62,
    "variation": 2.4600000002010347,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1939004.83,
        "sales": 1434.469999999972
      },
      "mpd2_nz4": {
        "reading": 801675.53,
        "sales": 688.5500000000466
      },
      "mpd3_nz3": {
        "reading": 2788439.08,
        "sales": 2012.470000000205
      },
      "mpd3_nz4": {
        "reading": 666582.1,
        "sales": 490.8499999999767
      }
    },
    "totalMeterSales": 4626.3400000002,
    "pumpTesting": 20.5,
    "netSales": 4605.8400000002,
    "id": "petrol-21"
  },
  {
    "date": "2026-03-22",
    "openingStock": 12067.62,
    "purchase": 0.0,
    "totalStock": 12067.62,
    "sales": 6375.579999999725,
    "closingStock": 5692.0400000002755,
    "actualDip": 5723.0,
    "variation": 30.95999999972446,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1941419.16,
        "sales": 2414.3299999998417
      },
      "mpd2_nz4": {
        "reading": 802312.59,
        "sales": 637.0599999999395
      },
      "mpd3_nz3": {
        "reading": 2791095.94,
        "sales": 2656.8599999998696
      },
      "mpd3_nz4": {
        "reading": 667269.43,
        "sales": 687.3300000000745
      }
    },
    "totalMeterSales": 6395.579999999725,
    "pumpTesting": 20.0,
    "netSales": 6375.579999999725,
    "id": "petrol-22"
  },
  {
    "date": "2026-03-23",
    "openingStock": 5723.0,
    "purchase": 5000.0,
    "totalStock": 10723.0,
    "sales": 4308.670000000042,
    "closingStock": 6414.329999999958,
    "actualDip": 6432.19,
    "variation": 17.86000000004151,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1942793.98,
        "sales": 1374.8200000000652
      },
      "mpd2_nz4": {
        "reading": 802684.97,
        "sales": 372.38000000000466
      },
      "mpd3_nz3": {
        "reading": 2793089.23,
        "sales": 1993.2900000000373
      },
      "mpd3_nz4": {
        "reading": 667858.11,
        "sales": 588.6799999999348
      }
    },
    "totalMeterSales": 4329.170000000042,
    "pumpTesting": 20.5,
    "netSales": 4308.670000000042,
    "id": "petrol-23"
  },
  {
    "date": "2026-03-24",
    "openingStock": 6432.19,
    "purchase": 5000.0,
    "totalStock": 11432.189999999999,
    "sales": 4211.520000000019,
    "closingStock": 7220.66999999998,
    "actualDip": 7246.0,
    "variation": 25.330000000019936,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1944169.29,
        "sales": 1375.3100000000559
      },
      "mpd2_nz4": {
        "reading": 803231.92,
        "sales": 546.9500000000698
      },
      "mpd3_nz3": {
        "reading": 2794815.88,
        "sales": 1726.6499999999069
      },
      "mpd3_nz4": {
        "reading": 668441.22,
        "sales": 583.109999999986
      }
    },
    "totalMeterSales": 4232.020000000019,
    "pumpTesting": 20.5,
    "netSales": 4211.520000000019,
    "id": "petrol-24"
  },
  {
    "date": "2026-03-25",
    "openingStock": 7246.0,
    "purchase": 5000.0,
    "totalStock": 12246.0,
    "sales": 7296.569999999949,
    "closingStock": 4949.430000000051,
    "actualDip": 4918.53,
    "variation": -30.900000000051477,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1946197.83,
        "sales": 2028.5400000000373
      },
      "mpd2_nz4": {
        "reading": 804533.72,
        "sales": 1301.7999999999302
      },
      "mpd3_nz3": {
        "reading": 2797349.57,
        "sales": 2533.689999999944
      },
      "mpd3_nz4": {
        "reading": 669950.65,
        "sales": 1509.4300000000512
      }
    },
    "totalMeterSales": 7373.459999999963,
    "pumpTesting": 76.89,
    "netSales": 7296.569999999962,
    "id": "petrol-25"
  },
  {
    "date": "2026-03-26",
    "openingStock": 4918.53,
    "purchase": 5000.0,
    "totalStock": 9918.529999999999,
    "sales": 4314.429999999935,
    "closingStock": 5604.100000000064,
    "actualDip": 5576.34,
    "variation": -27.760000000063883,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1947412.27,
        "sales": 1214.4399999999441
      },
      "mpd2_nz4": {
        "reading": 805217.04,
        "sales": 683.3200000000652
      },
      "mpd3_nz3": {
        "reading": 2798738.05,
        "sales": 1388.4799999999814
      },
      "mpd3_nz4": {
        "reading": 670998.84,
        "sales": 1048.1899999999441
      }
    },
    "totalMeterSales": 4334.429999999935,
    "pumpTesting": 20.0,
    "netSales": 4314.429999999935,
    "id": "petrol-26"
  },
  {
    "date": "2026-03-27",
    "openingStock": 5576.34,
    "purchase": 5000.0,
    "totalStock": 10576.34,
    "sales": 8084.260000000126,
    "closingStock": 2492.0799999998744,
    "actualDip": 2507.34,
    "variation": 15.260000000125729,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1949309.57,
        "sales": 1897.3000000000466
      },
      "mpd2_nz4": {
        "reading": 806403.36,
        "sales": 1186.3199999999488
      },
      "mpd3_nz3": {
        "reading": 2801625.4,
        "sales": 2887.350000000093
      },
      "mpd3_nz4": {
        "reading": 673132.13,
        "sales": 2133.2900000000373
      }
    },
    "totalMeterSales": 8104.260000000126,
    "pumpTesting": 20.0,
    "netSales": 8084.260000000126,
    "id": "petrol-27"
  },
  {
    "date": "2026-03-28",
    "openingStock": 2507.34,
    "purchase": 10000.0,
    "totalStock": 12507.34,
    "sales": 2657.0599999997066,
    "closingStock": 9850.280000000294,
    "actualDip": 9778.0,
    "variation": -72.28000000029351,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1950198.69,
        "sales": 889.1199999998789
      },
      "mpd2_nz4": {
        "reading": 806804.2,
        "sales": 400.8399999999674
      },
      "mpd3_nz3": {
        "reading": 2802676.51,
        "sales": 1051.1099999998696
      },
      "mpd3_nz4": {
        "reading": 673468.62,
        "sales": 336.4899999999907
      }
    },
    "totalMeterSales": 2677.5599999997066,
    "pumpTesting": 20.5,
    "netSales": 2657.0599999997066,
    "id": "petrol-28"
  },
  {
    "date": "2026-03-29",
    "openingStock": 9778.0,
    "purchase": 0.0,
    "totalStock": 9778.0,
    "sales": 3442.010000000475,
    "closingStock": 6335.989999999525,
    "actualDip": 6350.58,
    "variation": 14.590000000474902,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1951283.28,
        "sales": 1084.5900000000838
      },
      "mpd2_nz4": {
        "reading": 807175.46,
        "sales": 371.2600000000093
      },
      "mpd3_nz3": {
        "reading": 2804149.12,
        "sales": 1472.6100000003353
      },
      "mpd3_nz4": {
        "reading": 674002.17,
        "sales": 533.5500000000466
      }
    },
    "totalMeterSales": 3462.010000000475,
    "pumpTesting": 20.0,
    "netSales": 3442.010000000475,
    "id": "petrol-29"
  },
  {
    "date": "2026-03-30",
    "openingStock": 6350.58,
    "purchase": 5000.0,
    "totalStock": 11350.58,
    "sales": 2608.079999999958,
    "closingStock": 8742.500000000042,
    "actualDip": 8711.0,
    "variation": -31.500000000041837,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1952105.6,
        "sales": 822.3200000000652
      },
      "mpd2_nz4": {
        "reading": 807347.27,
        "sales": 171.81000000005588
      },
      "mpd3_nz3": {
        "reading": 2805478.71,
        "sales": 1329.589999999851
      },
      "mpd3_nz4": {
        "reading": 674307.03,
        "sales": 304.85999999998603
      }
    },
    "totalMeterSales": 2628.579999999958,
    "pumpTesting": 20.5,
    "netSales": 2608.079999999958,
    "id": "petrol-30"
  },
  {
    "date": "2026-03-31",
    "openingStock": 8711.0,
    "purchase": 5000.0,
    "totalStock": 13711.0,
    "sales": 2410.019999999902,
    "closingStock": 11300.980000000098,
    "actualDip": 11320.72,
    "variation": 19.739999999901556,
    "nozzles": {
      "mpd2_nz3": {
        "reading": 1952856.59,
        "sales": 750.9899999999907
      },
      "mpd2_nz4": {
        "reading": 807569.1,
        "sales": 221.8299999999581
      },
      "mpd3_nz3": {
        "reading": 2806609.19,
        "sales": 1130.4799999999814
      },
      "mpd3_nz4": {
        "reading": 674634.25,
        "sales": 327.21999999997206
      }
    },
    "totalMeterSales": 2430.519999999902,
    "pumpTesting": 20.5,
    "netSales": 2410.019999999902,
    "id": "petrol-31"
  }
];
