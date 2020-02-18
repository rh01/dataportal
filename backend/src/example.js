export default {
	"md_metadata": { // mandatory
		"file_identifier": uuid,
		"language": "en", // mandatory
		"hierarchy_level": "dataset", // mandatory, fixed list ['attribute','attributeType','collectionHardware','collectionSession','dataset','series','nonGeographicDataset','dimensionGroup','feature','featureType','propertyType','fieldSession','software','service','model','tile']
		"datestamp": createdAt, // mandatory
		"contact": [{ // mandatory
			"first_name": "Ewan", // mandatory
			"last_name": "O'Connor", // mandatory
			"organisation_name": "Finnish Meteorological Institute (FMI)", // mandatory
			"role_code": ["pointOfContact"], // mandatory, fixed list ['resourceProvider','custodian','owner,'user,'distributor,'originator,'pointOfContact,'principalInvestigator,'processor,'publisher,'author]
			"country": "Finland" // mandatory
		}],
		"online_resource": { // mandatory
			"linkage": "https://thiswillchange.fmi.fi/" // mandatory
		}
	},
	"md_identification": { // mandatory
		"abstract": title, // mandatory
		"title": title, // mandatory
		"identifier": uuid, // optional
		"date": measurementDate, // mandatory
		"date_type": "creation", // mandatory, fixed list ['publication', 'revision', 'creation'
		"contact": [{ // mandatory
			"first_name": "Simo", // mandatory
			"last_name": "Tukiainen", // mandatory
			"organisation_name": "Finnish Meteorological Institute (FMI)", // mandatory
			"role_code": ["processor"], // mandatory, see fixed list in example above
			"country": "Finland", // mandatory
		}],
		"online_resource": { // mandatory
			"linkage": "https://thiswillchange.fmi.fi" // mandatory
		}
	},
	"md_constraints": { // mandatory
		"access_constraints": "otherRestrictions", // mandatory
		"use_constraints": "otherRestrictions", // mandatory
		"other_constraints": "ACTRIS: http://actris.nilu.no/Content/Documents/DataPolicy.pdf, EMEP: Public open access. We encourage contacting data originators if substatial use of individual time series is planned (fair use data policy)., NILU: Public open access. We encourage contacting data originators if substatial use of individual time series is planned (fair use data policy)., GAW-WDCA: ", // mandatory
	},
	"md_keywords": { // mandatory
		"keywords": ["FMI", "ACTRIS"] // mandatory, limit on 60 character keyword
	},
	"md_data_identification": { // mandatory
		"language": "en", // mandatory
		"topic_category": "climatologyMeteorologyAtmosphere", // mandatory
		"description": "time series of point measurements at surface", // mandatory
		"station_wmo_region": "6", // mandatory
		"country_name": "Norway", // mandatory
		"station_name": "Zeppelin Mountain (Ny \u00c5lesund)", // mandatory, fixed list will be provided
		"station_identifier": "ZEP" // mandatory, fixed list will be provided
	},
	"ex_geographic_bounding_box": { // mandatory
		"west_bound_longitude": 11.88934, // mandatory
		"east_bound_longitude": 11.88934, // mandatory
		"south_bound_latitude": 78.90669, // mandatory
		"north_bound_latitude": 78.90669 // mandatory
	},
	"ex_temporal_extent": { // mandatory
		"time_period_begin": "2018-01-01T00:00:00", // mandatory
		"time_period_end": "2019-01-01T00:00:00" // mandatory
	},
	"ex_vertical_extent": { // optional
		"minimum_value": null, // optional
		"maximum_value": null, // optional
		"unit_of_measure": "m above sea level" // optional
	},
	"md_content_information": { // mandatory
		"attribute_description": ["particle_number_size_distribution"], // mandatory, list of parameters
		"content_type": "physicalMeasurement" // mandatory, fixed list ['image','thematicClassification','physicalMeasurement']
	},
	"md_distribution_information": { // mandatory
		"data_format": "NETCDF3_CLASSIC", // mandatory
		"version_data_format": "NETCDF3_CLASSIC", // mandatory
		"transfersize": null, // optional
		"dataset_url": "https://thredds.nilu.no/thredds/dodsC/ebas/NO0042G.20180101000000.20190508191242.dmps.particle_number_size_distribution.pm10.1y.1h.NO01L_NILU_DMPSmodel2_ZEP.NO01L_dmps_DMPS_ZEP01.lev2.nc", // mandatory
		"protocol": "http", // mandatory, fixed list ['http','opendap']
		"description": "Direct download of data file", // optional
		"function": "download", // mandatory
		"restriction": {
			"set": false, // mandatory
			"description_url": "https://ebas-submit.nilu.no/Data-Policy" // optional
		}
	},
	"dq_data_quality_information": { // optional
		"level": "dataset", // optional, fixed list ['attribute', 'attributeType', 'collectionHardware', 'collectionSession', 'dataset', 'series', 'nonGeographicDataset', 'dimensionGroup', 'feature', 'featureType', 'propertyType', 'fieldSession', 'software', 'service', 'model', 'tile']
		"statement": "Data collected according to instrument specific standard operating procedures, checked on import into data base.", // optional
		"description": "processing_level_test" // optional
	}, 
	"md_actris_specific": { // mandatory
		"platform_type": "surface_station", // mandatory ["surface_station", "simulation_chamber", "ballon"]
		"product_type": "observation", // mandatory ["model", "observation", "fundamental_parameter"]
		"matrix": "particle", // mandatory ["cloud", "gas", "particle", "met"]
		"sub_matrix": "pm10", // mandatory
		"instrument_type": ["dmps"], // mandatory
		"program_affiliation": ["ACTRIS"], // mandatory, fixed list ['ACTRIS', 'AMAP', 'AMAP_public','EUSAAR','EMEP','ACTRIS_preliminary','GAW-WDCA','GAW-WDCRG','NOAA-ESRL']
		"legacy_data": false, // mandatory
		"data_level": 2, // mandatory, fixed list [0, 1, 2, 3]
		"data_sublevel": null, // optional
		"data_product": "quality assured data" // mandatory, need fixed list e.g. ['higher level data','quality assured data', 'near-realtime-data']
	}
}