import { useQuery } from "@apollo/client";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  styled,
  Typography,
  Unstable_Grid2 as Grid2,
} from "@mui/material";
import { FC, memo, useEffect, useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { useSnackbar } from "notistack";
import { cloneDeep } from "lodash";
import {
  EditUserInput,
  RetrievePBACDefaultsResp,
  RetrievePBACDefaultsInput,
  RETRIEVE_PBAC_DEFAULTS,
} from "../../graphql";
import { ColumnizedPBACGroups, columnizePBACGroups, Logger } from "../../utils";

const StyledBox = styled(Box)({
  width: "957px",
  transform: "translateX(-50%)",
  marginLeft: "50%",
  marginTop: "63px",
});

const StyledAccordion = styled(Accordion)({
  width: "100%",
});

const StyledAccordionSummary = styled(AccordionSummary)({
  borderBottom: "1px solid #6B7294",
  minHeight: "unset !important",
  "& .MuiAccordionSummary-content": {
    margin: "9px 0",
  },
  "& .MuiAccordionSummary-content.Mui-expanded": {
    margin: "9px 0",
  },
  "& .MuiAccordionSummary-expandIconWrapper": {
    color: "#356AAD",
  },
});

const StyledAccordionHeader = styled(Typography)<{ component: React.ElementType }>({
  fontWeight: 700,
  fontSize: "16px",
  lineHeight: "19px",
  color: "#356AAD",
});

const StyledGroupTitle = styled(Typography)({
  fontWeight: 600,
  fontSize: "13px",
  lineHeight: "20px",
  color: "#187A90",
  textTransform: "uppercase",
  marginBottom: "7.5px",
  marginTop: "13.5px",
  userSelect: "none",
});

const StyledFormControlLabel = styled(FormControlLabel)({
  whiteSpace: "nowrap",
  userSelect: "none",
  "& .MuiTypography-root": {
    fontWeight: 400,
    fontSize: "16px",
    color: "#083A50 !important",
  },
  "& .MuiCheckbox-root": {
    paddingTop: "5.5px",
    paddingBottom: "5.5px",
    color: "#005EA2 !important",
  },
  "& .MuiTypography-root.Mui-disabled, & .MuiCheckbox-root.Mui-disabled": {
    opacity: 0.6,
    cursor: "not-allowed !important",
  },
});

const StyledNotice = styled(Typography)({
  marginTop: "29.5px",
  textAlign: "center",
  width: "100%",
  color: "#6B7294",
  userSelect: "none",
});

/**
 * Provides a panel for managing permissions and notifications for a user role.
 *
 * @returns The PermissionPanel component.
 */
const PermissionPanel: FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { setValue, watch } = useFormContext<EditUserInput>();

  const { data, loading } = useQuery<RetrievePBACDefaultsResp, RetrievePBACDefaultsInput>(
    RETRIEVE_PBAC_DEFAULTS,
    {
      variables: { roles: ["All"] },
      context: { clientName: "backend" },
      fetchPolicy: "cache-first",
      onError: (error) => {
        Logger.error("Failed to retrieve PBAC defaults", { error });
        enqueueSnackbar("Failed to retrieve PBAC defaults", { variant: "error" });
      },
    }
  );

  const selectedRole = watch("role");
  const permissionsValue = watch("permissions");
  const notificationsValue = watch("notifications");
  const roleRef = useRef<UserRole>(selectedRole);

  const permissionColumns = useMemo<ColumnizedPBACGroups<AuthPermissions>>(() => {
    if (!data?.retrievePBACDefaults && loading) {
      return [];
    }

    const defaults = data?.retrievePBACDefaults?.find((pbac) => pbac.role === selectedRole);
    if (!defaults || !defaults?.permissions) {
      Logger.error("Role not found in PBAC defaults", { role: selectedRole, data });
      return [];
    }

    const remappedPermissions: PBACDefault<AuthPermissions>[] = cloneDeep(defaults.permissions).map(
      (p) => ({ ...p, checked: permissionsValue.includes(p._id) })
    );

    return columnizePBACGroups(remappedPermissions, 3);
  }, [data, permissionsValue]);

  const notificationColumns = useMemo<ColumnizedPBACGroups<AuthNotifications>>(() => {
    if (!data?.retrievePBACDefaults && loading) {
      return [];
    }

    const defaults = data?.retrievePBACDefaults?.find((pbac) => pbac.role === selectedRole);
    if (!defaults || !defaults?.notifications) {
      Logger.error("Role not found in PBAC defaults", { role: selectedRole, data });
      return [];
    }

    const remappedNotifications: PBACDefault<AuthNotifications>[] = cloneDeep(
      defaults.notifications
    ).map((n) => ({ ...n, checked: notificationsValue.includes(n._id) }));

    return columnizePBACGroups(remappedNotifications, 3);
  }, [data, notificationsValue]);

  const handlePermissionChange = (_id: AuthPermissions) => {
    if (permissionsValue.includes(_id)) {
      setValue(
        "permissions",
        permissionsValue.filter((p) => p !== _id)
      );
    } else {
      setValue("permissions", [...permissionsValue, _id]);
    }
  };

  const handleNotificationChange = (_id: AuthNotifications) => {
    if (notificationsValue.includes(_id)) {
      setValue(
        "notifications",
        notificationsValue.filter((n) => n !== _id)
      );
    } else {
      setValue("notifications", [...notificationsValue, _id]);
    }
  };

  const handleRoleChange = (selectedRole: UserRole) => {
    if (selectedRole === roleRef.current) {
      return;
    }

    const defaults = data?.retrievePBACDefaults?.find((pbac) => pbac.role === selectedRole);
    setValue("permissions", defaults?.permissions?.filter((p) => p.checked).map((p) => p._id));
    setValue("notifications", defaults?.notifications?.filter((n) => n.checked).map((n) => n._id));
    roleRef.current = selectedRole;
  };

  useEffect(() => {
    handleRoleChange(selectedRole);
  }, [selectedRole]);

  return (
    <StyledBox>
      <StyledAccordion elevation={0} data-testid="permissions-accordion">
        <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
          <StyledAccordionHeader component="span">Permissions</StyledAccordionHeader>
        </StyledAccordionSummary>
        <AccordionDetails>
          <Grid2 container spacing={2}>
            {permissionColumns.map((column, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <Grid2 xs={4} key={index} data-testid={`permissions-column-${index}`}>
                {column.map(({ name, data }) => (
                  <div key={name} data-testid={`permissions-group-${name}`}>
                    <StyledGroupTitle>{name}</StyledGroupTitle>
                    <FormGroup>
                      {data.map(({ _id, checked, disabled, name }) => (
                        <StyledFormControlLabel
                          key={_id}
                          label={name}
                          onChange={() => handlePermissionChange(_id)}
                          control={<Checkbox name={_id} checked={checked} disabled={disabled} />}
                          data-testid={`permission-${_id}`}
                        />
                      ))}
                    </FormGroup>
                  </div>
                ))}
              </Grid2>
            ))}
            {permissionColumns.length === 0 && (
              <StyledNotice variant="body1" data-testid="no-permissions-notice">
                No permission options found for this role.
              </StyledNotice>
            )}
          </Grid2>
        </AccordionDetails>
      </StyledAccordion>
      <StyledAccordion elevation={0} data-testid="notifications-accordion">
        <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
          <StyledAccordionHeader component="span">Email Notifications</StyledAccordionHeader>
        </StyledAccordionSummary>
        <AccordionDetails>
          <Grid2 container spacing={2}>
            {notificationColumns.map((column, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <Grid2 xs={4} key={index} data-testid={`notifications-column-${index}`}>
                {column.map(({ name, data }) => (
                  <div key={name} data-testid={`notifications-group-${name}`}>
                    <StyledGroupTitle>{name}</StyledGroupTitle>
                    <FormGroup>
                      {data.map(({ _id, checked, disabled, name }) => (
                        <StyledFormControlLabel
                          key={_id}
                          label={name}
                          onChange={() => handleNotificationChange(_id)}
                          control={<Checkbox name={_id} checked={checked} disabled={disabled} />}
                          data-testid={`notification-${_id}`}
                        />
                      ))}
                    </FormGroup>
                  </div>
                ))}
              </Grid2>
            ))}
            {notificationColumns.length === 0 && (
              <StyledNotice variant="body1" data-testid="no-notifications-notice">
                No notification options found for this role.
              </StyledNotice>
            )}
          </Grid2>
        </AccordionDetails>
      </StyledAccordion>
    </StyledBox>
  );
};

export default memo(PermissionPanel);
