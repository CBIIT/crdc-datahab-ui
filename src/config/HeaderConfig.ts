import Logo from "../assets/header/Portal_Logo.svg";
import LogoSmall from "../assets/header/Portal_Logo_Small.svg";
import usaFlagSmall from "../assets/header/us_flag_small.svg";
import { DataCommons } from "./DataCommons";
import ApiInstructions from "../assets/pdf/CRDC_Data_Submission_API_Instructions.pdf";

export const DataSubmissionInstructionsLink =
  "https://datacommons.cancer.gov/data-submission-instructions";

// globalHeaderLogo image 468x100
// globalHeaderImage: image 2200x100
export const headerData = {
  globalHeaderLogo: Logo,
  globalHeaderLogoSmall: LogoSmall,
  globalHeaderLogoLink: "/",
  globalHeaderLogoAltText: "Portal Logo",
  usaFlagSmall,
  usaFlagSmallAltText: "usaFlagSmall",
};

export const HeaderLinks: NavBarItem[] = [
  {
    name: "Back to CRDC",
    link: "https://datacommons.cancer.gov/submit",
    id: "navbar-dropdown-join-crdc-data-hub",
    className: "navMobileItem",
  },
  {
    name: "Submission Requests",
    link: "/submissions",
    id: "navbar-dropdown-submission-requests",
    className: "navMobileItem",
  },
  {
    name: "Data Submissions",
    link: "/data-submissions",
    id: "navbar-dropdown-data-submissions",
    className: "navMobileItem",
  },
  {
    name: "Documentation",
    link: "#",
    id: "navbar-dropdown-documentation",
    className: "navMobileItem clickable",
  },
  {
    name: "Model Navigator",
    link: "#",
    id: "navbar-dropdown-model-navigator",
    className: "navMobileItem clickable",
  },
  {
    name: "Operation Dashboard",
    link: "/operation-dashboard",
    id: "navbar-dropdown-operation-dashboard",
    className: "navMobileItem",
    permissions: ["dashboard:view"],
  },
];

export const HeaderSubLinks: Record<string, NavBarSubItem[]> = {
  "Model Navigator": DataCommons.map((dc) => ({
    id: `model-navigator-${dc.name}`,
    name: `${dc.name}${dc.name.indexOf("Model") === -1 ? " Model" : ""}`,
    link: `/model-navigator/${dc.name}`,
    className: "navMobileSubItem",
  })),

  Documentation: [
    {
      name: "Submission Request Instructions",
      link: "https://datacommons.cancer.gov/submission-request-instructions",
      id: "submission-request-instructions",
      className: "navMobileSubItem",
    },
    {
      name: "Data Submission Instructions",
      link: DataSubmissionInstructionsLink,
      id: "data-submission-instructions",
      className: "navMobileSubItem",
    },
    {
      name: "API Instructions",
      link: ApiInstructions,
      id: "api-instructions",
      className: "navMobileSubItem",
    },
  ],
};
