import New from "../../../assets/history/submissionRequest/SubmissionRequestNew.svg";
import Submitted from "../../../assets/history/submissionRequest/SubmissionRequestSubmitted.svg";
import Rejected from "../../../assets/history/submissionRequest/Rejected.svg";
import Approved from "../../../assets/history/submissionRequest/Approved.svg";
import UnderReview from "../../../assets/history/submissionRequest/UnderReview.svg";
import StatusApproved from "../../../assets/history/submissionRequest/StatusApproved.svg";
import StatusRejected from "../../../assets/history/submissionRequest/StatusRejected.svg";
import InProgress from "../../../assets/history/submissionRequest/InProgress.svg";
import { IconType } from "../../HistoryDialog";

/**
 * Map of ApplicationStatus to Icon for History Modal
 *
 * @see ApplicationStatus
 */
export const HistoryIconMap: IconType<ApplicationStatus> = {
  New,
  Submitted,
  Rejected,
  Approved,
  "In Review": UnderReview,
  "In Progress": InProgress,
} as IconType<ApplicationStatus>;

/**
 * Map of ApplicationStatus to Icon for Status Bar
 *
 * @see ApplicationStatus
 */
export const StatusIconMap: IconType<ApplicationStatus> = {
  Rejected: StatusRejected,
  Approved: StatusApproved,
} as IconType<ApplicationStatus>;
