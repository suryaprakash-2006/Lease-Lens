/**
 * LeaseLens Metropolitan Coverage Constants
 * 25 locations across 6 approved metropolitan regions mapped to canonical model anchor cities.
 */

export const METRO_REGIONS = [
  {
    region: 'Delhi NCR',
    anchorCity: 'Delhi',
    locations: [
      { id: 'delhi-delhi', name: 'Delhi', anchorCity: 'Delhi', region: 'Delhi NCR' },
      { id: 'delhi-noida', name: 'Noida', anchorCity: 'Delhi', region: 'Delhi NCR' },
      { id: 'delhi-greater-noida', name: 'Greater Noida', anchorCity: 'Delhi', region: 'Delhi NCR' },
      { id: 'delhi-gurugram', name: 'Gurugram', anchorCity: 'Delhi', region: 'Delhi NCR' },
      { id: 'delhi-ghaziabad', name: 'Ghaziabad', anchorCity: 'Delhi', region: 'Delhi NCR' },
      { id: 'delhi-faridabad', name: 'Faridabad', anchorCity: 'Delhi', region: 'Delhi NCR' }
    ]
  },
  {
    region: 'Mumbai Metropolitan Region',
    anchorCity: 'Mumbai',
    locations: [
      { id: 'mumbai-mumbai', name: 'Mumbai', anchorCity: 'Mumbai', region: 'Mumbai Metropolitan Region' },
      { id: 'mumbai-thane', name: 'Thane', anchorCity: 'Mumbai', region: 'Mumbai Metropolitan Region' },
      { id: 'mumbai-navi-mumbai', name: 'Navi Mumbai', anchorCity: 'Mumbai', region: 'Mumbai Metropolitan Region' },
      { id: 'mumbai-kalyan', name: 'Kalyan', anchorCity: 'Mumbai', region: 'Mumbai Metropolitan Region' }
    ]
  },
  {
    region: 'Greater Hyderabad',
    anchorCity: 'Hyderabad',
    locations: [
      { id: 'hyd-hyderabad', name: 'Hyderabad', anchorCity: 'Hyderabad', region: 'Greater Hyderabad' },
      { id: 'hyd-secunderabad', name: 'Secunderabad', anchorCity: 'Hyderabad', region: 'Greater Hyderabad' },
      { id: 'hyd-gachibowli', name: 'Gachibowli', anchorCity: 'Hyderabad', region: 'Greater Hyderabad' }
    ]
  },
  {
    region: 'Bengaluru Urban',
    anchorCity: 'Bangalore',
    locations: [
      { id: 'blr-bengaluru', name: 'Bengaluru', anchorCity: 'Bangalore', region: 'Bengaluru Urban' },
      { id: 'blr-whitefield', name: 'Whitefield', anchorCity: 'Bangalore', region: 'Bengaluru Urban' },
      { id: 'blr-electronic-city', name: 'Electronic City', anchorCity: 'Bangalore', region: 'Bengaluru Urban' },
      { id: 'blr-yelahanka', name: 'Yelahanka', anchorCity: 'Bangalore', region: 'Bengaluru Urban' }
    ]
  },
  {
    region: 'Greater Kolkata',
    anchorCity: 'Kolkata',
    locations: [
      { id: 'kol-kolkata', name: 'Kolkata', anchorCity: 'Kolkata', region: 'Greater Kolkata' },
      { id: 'kol-howrah', name: 'Howrah', anchorCity: 'Kolkata', region: 'Greater Kolkata' },
      { id: 'kol-salt-lake', name: 'Salt Lake', anchorCity: 'Kolkata', region: 'Greater Kolkata' },
      { id: 'kol-rajarhat', name: 'Rajarhat / New Town', anchorCity: 'Kolkata', region: 'Greater Kolkata' }
    ]
  },
  {
    region: 'Chennai Metropolitan Area',
    anchorCity: 'Chennai',
    locations: [
      { id: 'chn-chennai', name: 'Chennai', anchorCity: 'Chennai', region: 'Chennai Metropolitan Area' },
      { id: 'chn-tambaram', name: 'Tambaram', anchorCity: 'Chennai', region: 'Chennai Metropolitan Area' },
      { id: 'chn-ambattur', name: 'Ambattur', anchorCity: 'Chennai', region: 'Chennai Metropolitan Area' },
      { id: 'chn-omr', name: 'OMR corridor', anchorCity: 'Chennai', region: 'Chennai Metropolitan Area' }
    ]
  }
];

export const ALL_LOCATIONS = METRO_REGIONS.flatMap((g) => g.locations);

export const DEFAULT_LOCATION = METRO_REGIONS[3].locations[0]; // Bengaluru (Bengaluru Urban -> Bangalore)
