import { MODEL_FILE_REPO } from '../config/DataCommons';
import env from '../env';

/**
 * Fetch the tracked Data Model content manifest.
 *
 * @returns The parsed content manifest.
 * @throws An error if the manifest cannot be fetched.
 */
export const fetchManifest = async (): Promise<DataModelManifest> => {
  if (sessionStorage.getItem("manifest")) {
    return JSON.parse(sessionStorage.getItem("manifest"));
  }

  const response = await fetch(`${MODEL_FILE_REPO}${env.REACT_APP_DEV_TIER || "prod"}/content.json`).catch(() => null);
  const parsed = await response?.json() || {};
  if (response && parsed) {
    sessionStorage.setItem("manifest", JSON.stringify(parsed));
    return parsed;
  }

  throw new Error("Unable to fetch manifest");
};

/**
 * Helper function to SAFELY build a set of base filter containers for the Data Model Navigator
 *
 * @example { category: [], uiDisplay: [], ... }
 * @param dc The data common to build the base filters for
 * @returns An array of base filters used by Data Model Navigator
 */
export const buildBaseFilterContainers = (dc: DataCommon): { [key: string]: [] } => {
  if (!dc || !dc?.configuration?.facetFilterSearchData) {
    return {};
  }
  if (!Array.isArray(dc.configuration.facetFilterSearchData) || dc.configuration.facetFilterSearchData.length === 0) {
    return {};
  }

  return dc.configuration.facetFilterSearchData.reduce((o, searchData) => ({
    ...o,
    [searchData?.datafield || "base"]: []
  }), {});
};

/**
 * Helper function to build an array of possible filter options for the Data Model Navigator
 *
 * @example [ 'administrative', 'case', ... ]
 * @param dc The data common to build the filter options list for
 * @returns An array of filter options used by Data Model Navigator
 */
export const buildFilterOptionsList = (dc: DataCommon): string[] => {
  if (!dc || !dc?.configuration?.facetFilterSearchData) {
    return [];
  }
  if (!Array.isArray(dc.configuration.facetFilterSearchData) || dc.configuration.facetFilterSearchData.length === 0) {
    return [];
  }

  return dc.configuration.facetFilterSearchData.reduce((a, searchData) => {
    if (!Array.isArray(searchData?.checkboxItems) || searchData.checkboxItems.length === 0) {
      return a;
    }

    return [
      ...a,
      ...searchData.checkboxItems.map((item) => item?.name?.toLowerCase()),
    ];
  }, []);
};
