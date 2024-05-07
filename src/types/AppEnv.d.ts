type AppEnv = {
  /**
   * Current environment
   *
   * @note `test` is used by Jest
   */
  NODE_ENV: "test" | "development" | "production";
  /**
   * NIH SSO Url
   */
  REACT_APP_NIH_AUTHORIZE_URL: string;
  /**
   * NIH SSO Client Id
   */
  REACT_APP_NIH_CLIENT_ID: string;
  /**
   * NIH SSO Redirect Url
   */
  REACT_APP_NIH_REDIRECT_URL: string;
  /**
   * Backend API URL
   *
   * @example "https://example.com/api/graphql"
   */
  REACT_APP_BACKEND_API: string;
  /**
   * Current deployment tier
   */
  REACT_APP_DEV_TIER: "dev" | "dev2" | "qa" | "qa2" | "stage" | "prod";
  /**
   * Fully-qualified URL to the Uploader CLI zip download
   *
   * @example "https://github.com/CBIIT/crdc-datahub-cli-uploader/releases/download/1.0.0/crdc-datahub-cli-uploader.zip"
   */
  REACT_APP_UPLOADER_CLI: string;
  /**
   * Google Analytic (GA4) Tracking ID
   *
   * @example "G-XXXXXXXXXX"
   */
  REACT_APP_GA_TRACKING_ID: string;
  /**
   * Current frontend build tag/version
   *
   * @example "mvp-2.213"
   */
  REACT_APP_FE_VERSION: string;
};
