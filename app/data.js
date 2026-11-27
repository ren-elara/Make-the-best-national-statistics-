// Archived observations, transcribed from the named ABS releases. No live requests.
export const edition = '2024 data edition';
export const sources = {
  population: {
    title: 'National, state and territory population',
    period: 'December 2024', released: '2025-06-19',
    url: 'https://www.abs.gov.au/statistics/people/population/national-state-and-territory-population/dec-2024',
    note: 'Estimated resident population. National totals include Other Territories. State populations are published to the nearest 100. Estimates after June 2021 are subject to revision.'
  },
  prices: {
    title: 'Consumer Price Index, Australia',
    period: 'December quarter 2024', released: '2025-01-29',
    url: 'https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/consumer-price-index-australia/dec-quarter-2024',
    note: 'Weighted average of eight capital cities. Annual percentage changes compare with the same quarter a year earlier. The trimmed mean is seasonally adjusted; headline CPI is not.'
  },
  labour: {
    title: 'Labour Force, Australia',
    period: 'December 2024', released: '2025-01-16',
    url: 'https://www.abs.gov.au/statistics/labour/employment-and-unemployment/labour-force-australia/dec-2024',
    note: 'Trend estimates for people aged 15 and over. These smooth seasonal and irregular movements and can be revised. Employment is people, not jobs.'
  },
  health: {
    title: 'Life expectancy', period: '2021–2023', released: '2024-11-08',
    url: 'https://www.abs.gov.au/statistics/people/population/life-expectancy/2021-2023',
    note: 'Period life expectancy at birth, in years. Based on three years of deaths and population data. This is not a prediction of an individual’s lifespan.'
  }
};

const quarters = ['Dec 2020', 'Mar 2021', 'Jun 2021', 'Sep 2021', 'Dec 2021', 'Mar 2022', 'Jun 2022', 'Sep 2022', 'Dec 2022', 'Mar 2023', 'Jun 2023', 'Sep 2023', 'Dec 2023', 'Mar 2024', 'Jun 2024', 'Sep 2024', 'Dec 2024'];
const points = (values, labels = quarters) => values.map((value, index) => ({ period: labels[index], value }));

export const indicators = [
  {
    id: 'inflation', name: 'Consumer price inflation', short: 'Inflation', topic: 'Prices & economy', source: 'prices',
    value: 2.4, unit: '%', precision: 1, period: 'Dec quarter 2024', frequency: 'Quarterly', basis: 'Annual change · original',
    summary: 'Prices rose more slowly. They did not fall.',
    definition: 'The change in the price of a basket of goods and services purchased by households across Australia’s eight capital cities.',
    insight: 'Annual inflation eased to 2.4%, down from 2.8% in September. Electricity rebates and lower automotive fuel prices helped slow the increase. A lower inflation rate still means the overall price level is rising.',
    caveat: 'CPI is an average basket, not your personal cost of living. Housing in CPI does not include the price of land or mortgage interest.',
    series: points([0.9, 1.1, 3.8, 3.0, 3.5, 5.1, 6.1, 7.3, 7.8, 7.0, 6.0, 5.4, 4.1, 3.6, 3.8, 2.8, 2.4]),
    comparison: points([1.3, 1.1, 1.6, 2.1, 2.6, 3.8, 4.9, 6.0, 6.8, 6.5, 5.8, 5.1, 4.2, 4.0, 4.0, 3.6, 3.2]), comparisonName: 'Trimmed mean',
    quarterly: points([0.9, 0.6, 0.8, 0.8, 1.3, 2.1, 1.8, 1.8, 1.9, 1.4, 0.8, 1.2, 0.6, 1.0, 1.0, 0.2, 0.2])
  },
  {
    id: 'population', name: 'Resident population', short: 'Population', topic: 'People & places', source: 'population',
    value: 27400013, unit: 'people', precision: 0, period: '31 Dec 2024', frequency: 'Quarterly', basis: 'Estimated resident population',
    summary: '27.4 million people. Eight different growth stories.',
    definition: 'The estimated number of people who usually live in Australia, regardless of nationality or citizenship.',
    insight: 'Australia added 445,924 residents over 2024. Net overseas migration contributed 340,750 people and natural increase 105,174. Western Australia grew fastest at 2.4%; Tasmania grew slowest at 0.3%.',
    caveat: 'The chart shows annual population growth, not the population level. State totals are rounded and exclude Other Territories; the national total includes them.',
    chartUnit: '%', chartName: 'Annual population growth',
    series: points([0.43, 0.10, 0.14, 0.28, 0.56, 1.01, 1.30, 1.81, 2.12, 2.32, 2.46, 2.53, 2.41, 2.26, 2.01, 1.78, 1.65])
  },
  {
    id: 'unemployment', name: 'Unemployment rate', short: 'Unemployment', topic: 'Work & income', source: 'labour',
    value: 4.0, unit: '%', precision: 1, period: 'Dec 2024', frequency: 'Monthly', basis: 'Trend · ages 15+',
    summary: 'A labour market seen through a steadier lens.',
    definition: 'Unemployed people as a percentage of the labour force: people who are employed or actively seeking and available for work.',
    insight: 'The December 2024 trend unemployment rate was 4.0%. Employment was 14,573,800 people, participation was 67.1%, and underemployment was 6.0%.',
    caveat: 'Trend estimates differ from seasonally adjusted estimates. This edition includes one verified monthly observation; it does not invent a historical line.',
    series: points([4.0], ['Dec 2024'])
  },
  {
    id: 'participation', name: 'Labour force participation', short: 'Participation', topic: 'Work & income', source: 'labour',
    value: 67.1, unit: '%', precision: 1, period: 'Dec 2024', frequency: 'Monthly', basis: 'Trend · ages 15+',
    summary: 'Who is working or looking for work?',
    definition: 'The labour force as a percentage of the civilian population aged 15 years and over.',
    insight: 'In December 2024, 67.1% of people aged 15 and over were employed or participating in the search for work. The employment-to-population ratio was 64.4%.',
    caveat: 'Participation does not measure hours worked or the quality of employment. These figures are trend estimates.',
    series: points([67.1], ['Dec 2024'])
  },
  {
    id: 'employment', name: 'Employed people', short: 'Employment', topic: 'Work & income', source: 'labour',
    value: 14573800, unit: 'people', precision: 0, period: 'Dec 2024', frequency: 'Monthly', basis: 'Trend · ages 15+',
    summary: '14.57 million people in employment.',
    definition: 'People aged 15 years and over who worked at least one hour for pay, profit or family gain in the reference week, or had a job but were temporarily absent.',
    insight: 'The trend estimate counted 14,573,800 employed people in December 2024. A person with multiple jobs is counted once.',
    caveat: 'This is a count of people, not positions or full-time equivalent jobs. This edition includes a single monthly observation.',
    series: points([14573800], ['Dec 2024'])
  },
  {
    id: 'life-female', name: 'Life expectancy · females', short: 'Female life expectancy', topic: 'Health & life', source: 'health',
    value: 85.1, unit: 'years', precision: 1, period: '2021–2023', frequency: 'Three-year period', basis: 'At birth · period estimate',
    summary: 'A longer view of how Australia lives.',
    definition: 'The average years a newborn female would live if age-specific death rates in 2021–2023 continued throughout her life.',
    insight: 'Female life expectancy was 85.1 years, 4.0 years above the male estimate of 81.1. The ACT and Western Australia had the highest female estimate, both 85.7 years.',
    caveat: 'Three-year periods overlap. Differences between adjacent points are not independent annual changes. The COVID-19 pandemic affected mortality in this period.',
    series: points([84.3, 84.4, 84.5, 84.6, 84.6, 84.9, 85.0, 85.3, 85.4, 85.3, 85.1], ['2011–2013', '2012–2014', '2013–2015', '2014–2016', '2015–2017', '2016–2018', '2017–2019', '2018–2020', '2019–2021', '2020–2022', '2021–2023'])
  },
  {
    id: 'life-male', name: 'Life expectancy · males', short: 'Male life expectancy', topic: 'Health & life', source: 'health',
    value: 81.1, unit: 'years', precision: 1, period: '2021–2023', frequency: 'Three-year period', basis: 'At birth · period estimate',
    summary: 'A national average with important regional gaps.',
    definition: 'The average years a newborn male would live if age-specific death rates in 2021–2023 continued throughout his life.',
    insight: 'Male life expectancy was 81.1 years. The ACT had the highest estimate at 81.7, while the Northern Territory had the lowest at 76.4 years.',
    caveat: 'Life expectancy describes a population under current mortality conditions, not an individual forecast. Three-year periods overlap.',
    series: points([80.1, 80.3, 80.4, 80.4, 80.5, 80.7, 80.9, 81.2, 81.3, 81.2, 81.1], ['2011–2013', '2012–2014', '2013–2015', '2014–2016', '2015–2017', '2016–2018', '2017–2019', '2018–2020', '2019–2021', '2020–2022', '2021–2023'])
  },
  {
    id: 'migration', name: 'Net overseas migration', short: 'Net migration', topic: 'People & places', source: 'population',
    value: 340750, unit: 'people', precision: 0, period: 'Year to Dec 2024', frequency: 'Quarterly', basis: 'Rolling annual total',
    summary: 'The largest contribution to population growth.',
    definition: 'The difference between overseas arrivals and departures that add to or subtract from the usually resident population.',
    insight: 'Net overseas migration added 340,750 residents over 2024, accounting for 76.4% of total population growth. It was below the annual peak of 555,798 in September 2023.',
    caveat: 'This is a net flow, not a count of visa grants or international border crossings. Preliminary migration estimates can be revised.',
    series: points([-4957, -94326, -84930, -55378, 9304, 131018, 207912, 348629, 437857, 495833, 538341, 555798, 530620, 493867, 430496, 372168, 340750])
  }
];

export const states = [
  { id: 'nsw', code: 'NSW', name: 'New South Wales', population: 8545100, growth: 1.3, increase: 108100, natural: 29444, interstate: -28118, overseas: 106730, male: 81.2, female: 85.2 },
  { id: 'vic', code: 'VIC', name: 'Victoria', population: 7011100, growth: 1.9, increase: 132600, natural: 35272, interstate: -3203, overseas: 100503, male: 81.5, female: 85.4 },
  { id: 'qld', code: 'QLD', name: 'Queensland', population: 5618800, growth: 1.9, increase: 102800, natural: 19939, interstate: 25940, overseas: 56877, male: 80.5, female: 84.7 },
  { id: 'sa', code: 'SA', name: 'South Australia', population: 1891700, growth: 1.1, increase: 20700, natural: 2709, interstate: -1582, overseas: 19546, male: 80.9, female: 85.0 },
  { id: 'wa', code: 'WA', name: 'Western Australia', population: 3008700, growth: 2.4, increase: 70300, natural: 12576, interstate: 12612, overseas: 45124, male: 81.6, female: 85.7 },
  { id: 'tas', code: 'TAS', name: 'Tasmania', population: 575800, growth: 0.3, increase: 1600, natural: 171, interstate: -2447, overseas: 3856, male: 80.2, female: 84.0 },
  { id: 'nt', code: 'NT', name: 'Northern Territory', population: 262200, growth: 1.2, increase: 3100, natural: 2283, interstate: -2234, overseas: 3081, male: 76.4, female: 80.4 },
  { id: 'act', code: 'ACT', name: 'Australian Capital Territory', population: 481700, growth: 1.4, increase: 6800, natural: 2801, interstate: -968, overseas: 5005, male: 81.7, female: 85.7 }
];

export const priceGroups = [
  ['Education', 6.5], ['Alcohol & tobacco', 6.2], ['Insurance & financial services', 5.4],
  ['Health', 4.0], ['Recreation & culture', 3.3], ['Food & non-alcoholic beverages', 3.0],
  ['Household furnishings & services', 1.5], ['Clothing & footwear', 1.3], ['Housing', 1.0], ['Communication', 0.0], ['Transport', -1.5]
];

export const topics = [
  { id: 'people', name: 'People & places', icon: 'people', description: 'Population, migration and the places we call home.', ids: ['population', 'migration'] },
  { id: 'prices', name: 'Prices & economy', icon: 'chart', description: 'Understand the price changes behind everyday life.', ids: ['inflation'] },
  { id: 'work', name: 'Work & income', icon: 'case', description: 'Employment, participation and the labour market.', ids: ['unemployment', 'participation', 'employment'] },
  { id: 'health', name: 'Health & life', icon: 'heart', description: 'Life expectancy and differences across the country.', ids: ['life-female', 'life-male'] }
];

export const findIndicator = id => indicators.find(item => item.id === id);
export const format = (value, precision = 0) => new Intl.NumberFormat('en-AU', { minimumFractionDigits: precision, maximumFractionDigits: precision }).format(value);
export const formatValue = item => item.unit === 'people' ? format(item.value) : `${format(item.value, item.precision)}${item.unit === '%' ? '%' : ' years'}`;
export const formatDate = iso => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function csvRows(item, observations = item.series) {
  const quote = value => `"${String(value).replaceAll('"', '""')}"`;
  const metadata = ['indicator', 'period', 'value', 'unit', 'basis', 'source', 'release_date'];
  return [metadata, ...observations.map(point => [item.chartName || item.name, point.period, point.value, item.chartUnit || item.unit, item.id === 'population' ? 'Annual change' : item.basis, sources[item.source].url, sources[item.source].released])].map(row => row.map(quote).join(',')).join('\r\n') + '\r\n';
}
