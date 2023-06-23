import React, { FC, createRef, useEffect, useRef, useState } from 'react';
import {
  Link, useNavigate,
  unstable_useBlocker as useBlocker, unstable_Blocker as Blocker
} from 'react-router-dom';
import { isEqual } from 'lodash';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Stack } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { WithStyles, withStyles } from "@mui/styles";
import ForwardArrowIcon from '@mui/icons-material/ArrowForwardIos';
import BackwardArrowIcon from '@mui/icons-material/ArrowBackIos';
import styled from '@emotion/styled';
import { Status as FormStatus, useFormContext } from '../../components/Contexts/FormContext';
import SuspenseLoader from '../../components/SuspenseLoader';
import StatusBar from '../../components/StatusBar/StatusBar';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import Section from './sections';
import map from '../../config/SectionConfig';

type Props = {
  section?: string;
  classes: WithStyles<typeof styles>['classes'];
};

const validateSection = (section: string) => typeof map[section] !== 'undefined';

const StyledSidebar = styled(Stack)({
  position: "sticky",
  top: "25px",
  paddingTop: "10px",
});

const StyledDivider = styled(Divider)({
  height: "520px",
  width: "1px",
  borderRightWidth: "2px",
  borderRightColor: "#E8EAEE9",
  margin: "0 23px",
});

/**
 * Intake Form View Component
 *
 * @param {Props} props
 * @returns {JSX.Element}
 */
const FormView: FC<Props> = ({ section, classes } : Props) => {
  const navigate = useNavigate();
  const { status, data, setData, error } = useFormContext();
  const [activeSection, setActiveSection] = useState<string>(validateSection(section) ? section : "A");
  const [blockedNavigate, setBlockedNavigate] = useState<boolean>(false);

  const sectionKeys = Object.keys(map);
  const sectionIndex = sectionKeys.indexOf(activeSection);
  const prevSection = sectionKeys[sectionIndex - 1] ? `/questionnaire/${data?.id}/${sectionKeys[sectionIndex - 1]}` : null;
  const nextSection = sectionKeys[sectionIndex + 1] ? `/questionnaire/${data?.id}/${sectionKeys[sectionIndex + 1]}` : null;

  const refs = {
    saveFormRef: createRef<HTMLButtonElement>(),
    submitFormRef: createRef<HTMLButtonElement>(),
    getFormObjectRef: useRef<(() => FormObject) | null>(null),
  };

  // Intercept React Router navigation actions with unsaved changes
  const blocker: Blocker = useBlocker(() => {
    if (isDirty()) {
      setBlockedNavigate(true);
      return true;
    }

    return false;
  });

  // Intercept browser navigation actions (e.g. closing the tab) with unsaved changes
  useEffect(() => {
    const unloadHandler = (event: BeforeUnloadEvent) => {
      if (isDirty()) {
        event.preventDefault();
        event.returnValue = 'You have unsaved form changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', unloadHandler);

    return () => {
      window.removeEventListener('beforeunload', unloadHandler);
    };
  });

  useEffect(() => {
    setActiveSection(validateSection(section) ? section : "A");
  }, [section]);

  /**
   * Determines if the form has unsaved changes.
   *
   * @returns {boolean} true if the form has unsaved changes, false otherwise
   */
  const isDirty = () : boolean => {
    const { ref, data: newData } = refs.getFormObjectRef.current?.() || {};

    return ref && (!data || !isEqual(data, newData));
  };

  /**
   * Saves the form data to the database.
   *
   * NOTE:
   * - This function relies on HTML5 reportValidity() to
   *   validate the form section status.
   *
   * @returns {Promise<boolean>} true if the save was successful, false otherwise
   */
  const saveForm = async () => {
    const { ref, data: newData } = refs.getFormObjectRef.current?.() || {};

    if (!ref.current || !newData) {
      return false;
    }

    // Update section status
    const newStatus = ref.current.reportValidity() ? "Completed" : "In Progress";
    const currentSection : Section = newData.sections.find((s) => s.name === activeSection);
    if (currentSection) {
      currentSection.status = newStatus;
    } else {
      newData.sections.push({ name: activeSection, status: newStatus });
    }

    // Skip state update if there are no changes
    if (!isEqual(data, newData)) {
      const r = await setData(newData);
      return r;
    }

    return true;
  };

  /**
   * Provides a save handler for the Unsaved Changes
   * dialog. Will save the form and then navigate to the
   * blocked section.
   *
   * @returns {void}
   */
  const saveAndNavigate = async () => {
    // Wait for the save handler to complete
    await saveForm();
    setBlockedNavigate(false);
    blocker.proceed();
  };

  /**
   * Provides a discard handler for the Unsaved Changes
   * dialog. Will discard the form changes and then navigate to the
   * blocked section.
   *
   * @returns {void}
   */
  const discardAndNavigate = () => {
    setBlockedNavigate(false);
    blocker.proceed();
  };

  if (status === FormStatus.LOADING) {
    return <SuspenseLoader />;
  }

  if (status === FormStatus.ERROR || !data) {
    navigate('/questionnaire', {
      state: { error: error || 'Unknown form loading error' },
    });
    return null;
  }

  return (
    <>
      <div className={classes.header}>
        <i>Questionnaire Header</i>
      </div>

      <Stack direction="row" justifyContent="center">
        <StyledSidebar
          direction="row"
          justifyContent="center"
          alignSelf="flex-start"
        >
          <ProgressBar section={activeSection} />
          <StyledDivider orientation="vertical" />
        </StyledSidebar>

        <Stack className={classes.content} direction="column" spacing={2}>
          <StatusBar />

          <Section section={activeSection} refs={refs} />

          <Stack
            className={classes.controls}
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={2}
          >
            <Link to={prevSection} style={{ pointerEvents: prevSection ? "initial" : "none" }}>
              <Button
                variant="outlined"
                type="button"
                disabled={status === FormStatus.SAVING || !prevSection}
                size="large"
                startIcon={<BackwardArrowIcon />}
              >
                Back
              </Button>
            </Link>
            <LoadingButton
              variant="outlined"
              type="button"
              ref={refs.saveFormRef}
              size="large"
              loading={status === FormStatus.SAVING}
              onClick={saveForm}
            >
              Save
            </LoadingButton>
            <LoadingButton
              variant="outlined"
              type="submit"
              ref={refs.submitFormRef}
              size="large"
            >
              Submit
            </LoadingButton>
            <Link to={nextSection} style={{ pointerEvents: nextSection ? "initial" : "none" }}>
              <Button
                variant="outlined"
                type="button"
                disabled={status === FormStatus.SAVING || !nextSection}
                size="large"
                endIcon={<ForwardArrowIcon />}
              >
                Next
              </Button>
            </Link>
          </Stack>
        </Stack>
      </Stack>

      <Dialog open={blockedNavigate}>
        <DialogTitle>
          Unsaved Changes
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. Your changes will be lost if you leave this section without saving.
            Do you want to save your data?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockedNavigate(false)} disabled={status === FormStatus.SAVING}>Cancel</Button>
          <LoadingButton onClick={saveAndNavigate} loading={status === FormStatus.SAVING} autoFocus>Save</LoadingButton>
          <Button onClick={discardAndNavigate} disabled={status === FormStatus.SAVING} color="error">Discard</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const styles = () => ({
  header: {
    width: "100%",
    height: "300px",
    background: "#F2F4F8",
  },
  content: {
    // maxWidth: "900px", // TODO: Update per design spec
  },
  controls: {
    color: "#000000",
    "& button": {
      margin: "0 6px",
      padding: "10px 20px",
      minWidth: "115px",
      borderRadius: "24px",
      color: "inherit",
      borderColor: "#8B9EB3 !important",
      background: "#fff",
      textTransform: "none",
    },
    "& button:disabled": {
      background: "#D9DEE4",
    },
    "& button:hover:not([disabled])": {
      color: "#fff",
      background: "#2A2A2A",
    },
    "& a": {
      color: "inherit",
      textDecoration: "none",
    }
  },
});

export default withStyles(styles)(FormView);
