import { File } from '../entity/File'
import axios from 'axios'

export function translateFile2Actris(file: File) {
  const site = file.site
  return {
    'md_metadata': { // mandatory
      'file_identifier': file.pid,
      'language': 'en', // mandatory
      'hierarchy_level': 'dataset', // mandatory, fixed list ['attribute','attributeType','collectionHardware','collectionSession','dataset','series','nonGeographicDataset','dimensionGroup','feature','featureType','propertyType','fieldSession','software','service','model','tile']
      'datestamp': file.releasedAt, // mandatory
      'contact': [{ // mandatory
        'first_name': 'Ewan', // mandatory
        'last_name': 'O\'Connor', // mandatory
        'organisation_name': 'Finnish Meteorological Institute (FMI)', // mandatory
        'role_code': ['pointOfContact'], // mandatory, fixed list ['resourceProvider','custodian','owner,'user,'distributor,'originator,'pointOfContact,'principalInvestigator,'processor,'publisher,'author]
        'country': 'Finland' // mandatory
      }],
      'online_resource': { // mandatory
        'linkage': 'https://cloudnet.fmi.fi/' // mandatory
      }
    },
    'md_identification': { // mandatory
      'abstract': file.title, // mandatory
      'title': file.title, // mandatory
      'identifier': file.pid, // optional
      'date': new Date(file.measurementDate), // mandatory
      'date_type': 'creation', // mandatory, fixed list ['publication', 'revision', 'creation'
      'contact': [{ // mandatory
        'first_name': 'Simo', // mandatory
        'last_name': 'Tukiainen', // mandatory
        'organisation_name': 'Finnish Meteorological Institute (FMI)', // mandatory
        'role_code': ['processor'], // mandatory, see fixed list in example above
        'country': 'Finland', // mandatory
      }],
      'online_resource': { // mandatory
        'linkage': `https://cloudnet.fmi.fi/file/${file.uuid}` // mandatory
      }
    },
    'md_constraints': { // mandatory
      'access_constraints': 'otherRestrictions', // mandatory
      'use_constraints': 'otherRestrictions', // mandatory
      'other_constraints': 'http://actris.nilu.no/Content/Documents/DataPolicy.pdf', // mandatory
    },
    'md_keywords': { // mandatory
      'keywords': ['FMI', 'ACTRIS', file.product.humanReadableName] // mandatory, limit on 60 character keyword
    },
    'md_data_identification': { // mandatory
      'language': 'en', // mandatory
      'topic_category': 'climatologyMeteorologyAtmosphere', // mandatory
      'description': 'time series of point measurements', // mandatory
      'station_wmo_region': '6', // mandatory
      'country_name': site.country, // mandatory
      'station_name': site.humanReadableName, // mandatory, fixed list will be provided
      'station_identifier': site.gaw // mandatory, fixed list will be provided
    },
    'ex_geographic_bounding_box': { // mandatory
      'west_bound_longitude': site.longitude, // mandatory
      'east_bound_longitude': site.longitude, // mandatory
      'south_bound_latitude': site.latitude, // mandatory
      'north_bound_latitude': site.latitude // mandatory
    },
    'ex_temporal_extent': { // mandatory
      'time_period_begin': file.measurementDate, // mandatory
      'time_period_end': file.measurementDate // mandatory
    },
    'ex_vertical_extent': { // optional
      'minimum_value': null, // optional
      'maximum_value': null, // optional
      'unit_of_measure': 'm above sea level' // optional
    },
    'md_content_information': { // mandatory
      'attribute_description': file.product.variables.map(prodVar => prodVar.id), // mandatory, list of parameters
      'content_type': 'physicalMeasurement' // mandatory, fixed list ['image','thematicClassification','physicalMeasurement']
    },
    'md_distribution_information': { // mandatory
      'data_format': file.format, // mandatory
      'version_data_format': file.format, // mandatory
      'transfersize': file.size, // optional
      'dataset_url': `https://cloudnet.fmi.fi/download/${file.filename}`, // mandatory
      'protocol': 'http', // mandatory, fixed list ['http','opendap']
      'description': 'Direct download of data file', // optional
      'function': 'download', // mandatory
      'restriction': {
        'set': false, // mandatory
      }
    },
    'md_actris_specific': { // mandatory
      'platform_type': 'surface_station', // mandatory ["surface_station", "simulation_chamber", "ballon"]
      'product_type': file.product.id == 'model' ? 'model' : 'observation', // mandatory ["model", "observation", "fundamental_parameter"]
      'matrix': 'cloud', // mandatory ["cloud", "gas", "particle", "met"]
      'sub_matrix': 'pm10', // mandatory
      'instrument_type': [(file.product.level == '2') || (file.product.id == 'model') ? 'UNKNOWN' : file.product], // mandatory
      'program_affiliation': ['ACTRIS'], // mandatory, fixed list ['ACTRIS', 'AMAP', 'AMAP_public','EUSAAR','EMEP','ACTRIS_preliminary','GAW-WDCA','GAW-WDCRG','NOAA-ESRL']
      'legacy_data': false, // mandatory
      'data_level': file.product.level, // mandatory, fixed list [0, 1, 2, 3]
      'data_sublevel': null, // optional
      'data_product': 'near-realtime-data' // mandatory, need fixed list e.g. ['higher level data','quality assured data', 'near-realtime-data']
    },
    'dq_data_quality_information': { // optional
      'level': 'dataset', // optional, fixed list ['attribute', 'attributeType', 'collectionHardware', 'collectionSession', 'dataset', 'series', 'nonGeographicDataset', 'dimensionGroup', 'feature', 'featureType', 'propertyType', 'fieldSession', 'software', 'service', 'model', 'tile']
    },
  }
}

export function sendFileToActris(file: File) {
  const headers = {
    'content-type': 'application/json',
  }
  axios.post('https://dev-actris-md.nilu.no/Metadata/add', translateFile2Actris(file), { headers })
}
