/**
 * Formats a Authentication IDP for visual display
 *
 * @param IDP the IDP to format
 * @returns formatted IDP for visual display
 */
export const formatIDP = (idp: User["IDP"]): string => {
  if (!idp || typeof idp !== "string") {
    return "";
  }

  switch (idp.toLowerCase()) {
    case "nih":
      return "NIH";
    case "login.gov":
      return "Login.gov";
    default:
      return idp;
  }
};

/**
 * Converts a user object to a collaborator object
 *
 * @param {User} user Partial user object
 * @param {CollaboratorPermissions} permission Collaborator permission
 * @returns {Collaborator} Collaborator object
 */
export const userToCollaborator = (
  user: Partial<User>,
  permission: CollaboratorPermissions = "Can Edit"
): Collaborator => ({
  collaboratorID: user?._id,
  collaboratorName: `${user?.lastName || ""}, ${user?.firstName || ""}`,
  permission,
});

/**
 * The data structure for a columized PBAC group
 */
export type ColumnizedPBACGroups<T = unknown> = {
  /**
   * The name of the group of PBACDefaults
   *
   * All PBACDefaults in the group will have the same group name
   */
  name: string;
  /**
   * The PBACDefaults for the group
   */
  data: PBACDefault<T>[];
}[][];

/**
 * A utility function to group an array of PBACDefaults into columns
 * based on the group name.
 *
 * If the number of unique groups exceeds `colCount`, the function will
 * aggregate the remaining groups into the last column.
 *
 * Data Structure: Array of Columns -> Array of Groups -> PBAC Defaults for the group
 *
 * @see {@link ColumnizedPBACGroups}
 * @param data The array of PBACDefaults to columnize
 * @param colCount The number of columns to create
 * @returns An array of columns containing an array of PBACDefaults
 */
export const columnizePBACGroups = <T = unknown>(
  data: PBACDefault<T>[],
  colCount = 3
): ColumnizedPBACGroups<T> => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  // Group the PBACDefaults by their group name
  const groupedData: Record<string, PBACDefault<T>[]> = {};
  data.forEach((item) => {
    const groupName = typeof item?.group === "string" ? item.group : "";
    if (!groupedData[groupName]) {
      groupedData[groupName] = [];
    }

    groupedData[groupName].push(item);
  });

  // Sort the PBACDefaults within each group
  Object.values(groupedData).forEach((options: PBACDefault<T>[]) => {
    options.sort((a: PBACDefault<T>, b: PBACDefault<T>) => (a?.order || 0) - (b?.order || 0));
  });

  // Sort the groups by their partial group name
  const sortedGroups = Object.entries(groupedData);
  sortedGroups.sort(([a], [b]) => orderPBACGroups(a, b));

  // Columnize the groups
  const columns: ColumnizedPBACGroups<T> = [];
  sortedGroups.forEach(([group, data], index) => {
    const groupIndex = index > colCount - 1 ? colCount - 1 : index;
    if (!columns[groupIndex]) {
      columns[groupIndex] = [];
    }

    columns[groupIndex].push({ name: group, data });
  });

  return columns;
};

/**
 * A utility function to order PBAC Groups by their partial group name in the following order:
 *
 * 1. Submission Request
 * 2. Data Submission
 * 3. Admin
 * 4. Miscellaneous
 * 5. All other groups
 *
 * If the name does not contain any of the above groups, it will be pushed to the end,
 * but will not be sorted against other unlisted groups.
 *
 * @param groups The groups to order
 * @returns The ordered groups in the format of Record<string, T[]>
 */
export const orderPBACGroups = (a: string, b: string): number => {
  const SORT_PRIORITY = ["Submission Request", "Data Submission", "Admin", "Miscellaneous"];

  const aIndex = SORT_PRIORITY.findIndex((group) => a.includes(group));
  const bIndex = SORT_PRIORITY.findIndex((group) => b.includes(group));

  if (aIndex === -1 && bIndex === -1) {
    return 0;
  }

  if (aIndex === -1) {
    return 1;
  }

  if (bIndex === -1) {
    return -1;
  }

  return aIndex - bIndex;
};
