import { useState } from 'react';
import { createStore, applyMiddleware, combineReducers, Store } from 'redux';
import { ddgraph, moduleReducers as submission, versionInfo, getModelExploreData } from 'data-model-navigator';
import ReduxThunk from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { baseConfiguration, defaultReadMeTitle, graphViewConfig } from '../../../config/ModelNavigator';
import { MODEL_FILE_REPO } from '../../../config/DataCommons';
import env from '../../../env';
import { buildBaseFilterContainers, buildFilterOptionsList } from '../../../utils/dataModelUtils';

export type Status = "waiting" | "loading" | "error" | "success";

const makeStore = (): Store => {
  const reducers = { ddgraph, versionInfo, submission };
  const loggerMiddleware = createLogger();

  const newStore = createStore(combineReducers(reducers), applyMiddleware(ReduxThunk, loggerMiddleware));

  // @ts-ignore
  newStore.injectReducer = (key, reducer) => {
    reducers[key] = reducer;
    newStore.replaceReducer(combineReducers(reducers));
  };

  return newStore;
};

/**
 * A hook to build and populate the Redux store with DMN data
 *
 * @params {void}
 * @returns {Status} - the status of the hook
 */
const useBuildReduxStore = (): [{ status: Status, store: Store }, () => void, (assets: DataCommon) => void] => {
  const [status, setStatus] = useState<Status>("waiting");
  const [store, setStore] = useState<Store>(makeStore());

  /**
   * Rebuilds the store from scratch
   *
   * @params {void}
   */
  const resetStore = () => {
    setStatus("loading");
    setStore(makeStore());
  };

  /**
   * Injects the Data Model into the store
   *
   * @param datacommon The Data Model to inject assets from
   */
  const populateStore = async (datacommon: DataCommon) => {
    if (!datacommon?.name || !datacommon?.assets || !datacommon?.assets["current-version"]) {
      setStatus("error");
      return;
    }

    const tier = env.REACT_APP_DEV_TIER || "prod";
    const ASSET_URLS: { [key: string]: string } = {
      model: `${MODEL_FILE_REPO}${tier}/${datacommon.name}/${datacommon.assets["current-version"]}/${datacommon.assets["model-file"]}`,
      props: `${MODEL_FILE_REPO}${tier}/${datacommon.name}/${datacommon.assets["current-version"]}/${datacommon.assets["prop-file"]}`,
      readme: `${MODEL_FILE_REPO}${tier}/${datacommon.name}/${datacommon.assets["current-version"]}/${datacommon.assets["readme-file"]}`,
    };

    setStatus("loading");

    const response = await getModelExploreData(ASSET_URLS.model, ASSET_URLS.props);
    if (!response?.data || !response?.version) {
      setStatus("error");
      return;
    }

    store.dispatch({ type: 'RECEIVE_VERSION_INFO', data: response.version });
    store.dispatch({
      type: 'REACT_FLOW_GRAPH_DICTIONARY',
      dictionary: response.data,
      pdfDownloadConfig: datacommon.configuration.pdfConfig,
      graphViewConfig
    });
    store.dispatch({
      type: 'RECEIVE_DICTIONARY',
      payload: {
        data: response.data,
        facetfilterConfig: {
          ...baseConfiguration,
          facetSearchData: datacommon.configuration.facetFilterSearchData,
          facetSectionVariables: datacommon.configuration.facetFilterSectionVariables,
          facetFilterSections: datacommon.configuration.facetFilterSearchData.map((s) => s?.datafield),
          baseFacetFilters: buildBaseFilterContainers(datacommon),
          filterOptions: buildFilterOptionsList(datacommon),
        },
        readMeConfig: {
          readMeUrl: ASSET_URLS.readme,
          readMeTitle: datacommon.configuration?.readMeTitle || defaultReadMeTitle,
        },
        pdfDownloadConfig: datacommon.configuration.pdfConfig,
        graphViewConfig,
      },
    });

    setStatus("success");
  };

  return [{ status, store }, resetStore, populateStore];
};

export default useBuildReduxStore;
