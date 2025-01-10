const NO_CONDITIONS = "NO CONDITIONS";

type PermissionCheck<Key extends keyof Permissions> =
  | typeof NO_CONDITIONS
  | ((user: User, data: Permissions[Key]["dataType"]) => boolean);

type PermissionMap = {
  [Key in keyof Permissions]: Partial<{
    [Action in Permissions[Key]["action"]]: PermissionCheck<Key>;
  }>;
};

type Permissions = {
  access: {
    dataType: null;
    action: "request";
  };
  dashboard: {
    dataType: null;
    action: "view";
  };
  submission_request: {
    dataType: Application;
    action: "view" | "create" | "submit" | "review";
  };
  data_submission: {
    dataType: Submission;
    action: "view" | "create" | "review" | "admin_submit" | "confirm";
  };
  user: {
    dataType: null;
    action: "manage";
  };
  program: {
    dataType: null;
    action: "manage";
  };
  study: {
    dataType: null;
    action: "manage";
  };
};

export const PERMISSION_MAP = {
  submission_request: {
    view: NO_CONDITIONS,
    create: NO_CONDITIONS,
    submit: (user, application) => {
      const isFormOwner = application?.applicant?.applicantID === user?._id;
      const hasPermissionKey = user?.permissions?.includes("submission_request:submit");
      const submitStatuses: ApplicationStatus[] = ["In Progress", "Inquired"];

      // Check for implicit permission as well as for the permission key
      if (!isFormOwner && !hasPermissionKey) {
        return false;
      }
      if (!submitStatuses?.includes(application?.status)) {
        return false;
      }

      return true;
    },
    review: NO_CONDITIONS,
  },
  dashboard: {
    view: NO_CONDITIONS,
  },
  data_submission: {
    view: NO_CONDITIONS,
    create: (user, submission) => {
      const hasPermissionKey = user?.permissions?.includes("data_submission:create");
      const isSubmissionOwner = submission?.submitterID === user?._id;
      const isCollaborator = submission?.collaborators?.some((c) => c.collaboratorID === user?._id);

      if (isCollaborator) {
        return true;
      }
      if (isSubmissionOwner && hasPermissionKey) {
        return true;
      }

      return false;
    },
    review: (user, submission) => {
      const { role, dataCommons, studies } = user;
      const hasPermissionKey = user?.permissions?.includes("data_submission:review");

      if (role === "Federal Lead" && hasPermissionKey) {
        return studies?.some((s) => s._id === submission.studyID || s._id === "All");
      }
      if (role === "Data Commons Personnel" && hasPermissionKey) {
        return dataCommons?.some((dc) => dc === submission?.dataCommons);
      }
      if (role === "Admin" && hasPermissionKey) {
        return true;
      }

      return false;
    },
    admin_submit: (user, submission) => {
      const { role, dataCommons, studies } = user;
      const hasPermissionKey = user?.permissions?.includes("data_submission:admin_submit");

      if (role === "Federal Lead" && hasPermissionKey) {
        return studies?.some((s) => s._id === submission.studyID || s._id === "All");
      }
      if (role === "Data Commons Personnel" && hasPermissionKey) {
        return dataCommons?.some((dc) => dc === submission?.dataCommons);
      }
      if (role === "Admin" && hasPermissionKey) {
        return true;
      }

      return false;
    },
    confirm: (user, submission) => {
      const { role, dataCommons, studies } = user;
      const hasPermissionKey = user?.permissions?.includes("data_submission:confirm");

      if (role === "Federal Lead" && hasPermissionKey) {
        return studies?.some((s) => s._id === submission.studyID || s._id === "All");
      }
      if (role === "Data Commons Personnel" && hasPermissionKey) {
        return dataCommons?.some((dc) => dc === submission?.dataCommons);
      }
      if (role === "Admin" && hasPermissionKey) {
        return true;
      }

      return false;
    },
  },
  access: {
    request: NO_CONDITIONS,
  },
  user: {
    manage: NO_CONDITIONS,
  },
  program: {
    manage: NO_CONDITIONS,
  },
  study: {
    manage: NO_CONDITIONS,
  },
} as const satisfies PermissionMap;

/**
 * Determines if a user has the necessary permission to perform a specific action on a resource.
 *
 * @template Resource - A key of the `Permissions` type representing the resource to check.
 * @param {User} user - The user object, which contains the user's role and permissions.
 * @param {Resource} resource - The resource on which the action is being performed.
 * @param {Permissions[Resource]["action"]} action - The action to check permission for.
 * @param {Permissions[Resource]["dataType"]} [data] - Optional additional data needed for dynamic permission checks.
 * @param {boolean} onlyKey - Optional flag for checking ONLY if the user has the permission key.
 * @returns {boolean} - `true` if the user has permission, otherwise `false`.
 *
 * @example
 * // Basic permission check without additional data
 * const canCreate = hasPermission(user, "submission_request", "create");
 *
 * @example
 * // Permission check with additional data
 * const canSubmit = hasPermission(user, "submission_request", "submit", applicationData);
 */
export const hasPermission = <Resource extends keyof Permissions>(
  user: User,
  resource: Resource,
  action: Permissions[Resource]["action"],
  data?: Permissions[Resource]["dataType"],
  onlyKey?: boolean
): boolean => {
  if (!user?.role) {
    return false;
  }

  const permission = (PERMISSION_MAP as PermissionMap)?.[resource]?.[action];
  const permissionKey = `${resource}:${action}`;

  // If no conditions need to be checked, just check if user has permission key
  if (onlyKey || permission === NO_CONDITIONS) {
    return user.permissions?.includes(permissionKey as AuthPermissions);
  }

  // If permission not defined, then deny permission
  if (permission == null) {
    return false;
  }

  // Check conditions
  return !!data && permission(user, data);
};
