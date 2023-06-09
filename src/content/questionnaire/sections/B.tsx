import React, { FC, useEffect, useRef, useState } from "react";
import { AutocompleteChangeReason, Button, Grid, Stack } from '@mui/material';
import { parseForm } from '@jalik/form-parser';
import { withStyles } from '@mui/styles';
import { cloneDeep } from 'lodash';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import LabelIcon from '@mui/icons-material/Label';
import programOptions from '../../../config/ProgramConfig';
import { Status as FormStatus, useFormContext } from "../../../components/Contexts/FormContext";
import FormContainer from "../../../components/Questionnaire/FormContainer";
import SectionGroup from "../../../components/Questionnaire/SectionGroup";
import TextInput from "../../../components/Questionnaire/TextInput";
import Autocomplete from '../../../components/Questionnaire/AutocompleteInput';
import Publication from '../../../components/Questionnaire/Publication';
import Repository from '../../../components/Questionnaire/Repository';
import { findProgram, findStudy, mapObjectWithKey } from '../utils';

type KeyedPublication = {
  key: string;
} & Publication;

type KeyedRepository = {
  key: string;
} & Repository;

/**
 * Form Section B View
 *
 * @param {FormSectionProps} props
 * @returns {JSX.Element}
 */
const FormSectionB: FC<FormSectionProps> = ({ refs, classes }: FormSectionProps) => {
  const { status, data } = useFormContext();

  const [program, setProgram] = useState<Program>(data.program);
  const [programOption, setProgramOption] = useState<ProgramOption>(findProgram(program.title));
  const [study, setStudy] = useState<Study>(data.study);
  const [studyOption, setStudyOption] = useState<StudyOption>(findStudy(study.title, programOption));
  const [publications, setPublications] = useState<KeyedPublication[]>(data.publications?.map(mapObjectWithKey) || []);
  const [repositories, setRepositories] = useState<KeyedRepository[]>(data.study?.repositories?.map(mapObjectWithKey) || []);
  const [funding] = useState<Funding>(data.funding);

  const formRef = useRef<HTMLFormElement>();
  const {
    saveFormRef, submitFormRef, getFormObjectRef,
  } = refs;

  useEffect(() => {
    if (!saveFormRef.current || !submitFormRef.current) { return; }

    saveFormRef.current.style.display = "initial";
    submitFormRef.current.style.display = "none";

    getFormObjectRef.current = getFormObject;
  }, [refs]);

  const getFormObject = () : FormObject | null => {
    if (!formRef.current) { return null; }

    const formObject = parseForm(formRef.current, { nullify: false });
    const combinedData = { ...cloneDeep(data), ...formObject };

    // Reset publications if the user has not entered any publications
    if (!formObject.publications || formObject.publications.length === 0) {
      combinedData.publications = [];
    }

    return { ref: formRef, data: combinedData };
  };

  /**
   * Handles the program change event and updates program/study states
   *
   * @param e event
   * @param value new program title
   * @param r Reason for the event dispatch
   * @returns {void}
   */
  const handleProgramChange = (e: React.SyntheticEvent, value: string, r: AutocompleteChangeReason) => {
    if (r !== "selectOption") { return; }

    const newProgram = findProgram(value);
    if (newProgram?.isCustom) {
      setProgram({ title: "", abbreviation: "", description: "" });
    } else {
      setProgram({ title: newProgram.title, abbreviation: newProgram.abbreviation, description: "" });
    }

    // Only reset study if the study is not currently custom
    // The user may have entered a "Other" study and then changed the program
    // and we don't want to reset the entered information
    if (!studyOption?.isCustom) {
      const newStudy = newProgram.studies[0];
      if (newStudy?.isCustom) {
        setStudy({ ...study, title: "", abbreviation: "", description: "" });
      } else {
        setStudy({ ...study, ...newProgram.studies[0] });
      }

      setStudyOption(newProgram.studies[0]);
    }

    setProgramOption(newProgram);
  };

  /**
   * Handles the study change event and updates the state
   *
   * @param e event
   * @param value new study title
   * @param r Reason for the event dispatch
   * @returns {void}
   */
  const handleStudyChange = (e: React.SyntheticEvent, value: string, r: AutocompleteChangeReason) => {
    if (r !== "selectOption") { return; }

    const newStudy = findStudy(value, programOption);
    if (newStudy?.isCustom) {
      setStudy({ ...study, title: "", abbreviation: "", description: "" });
    } else {
      setStudy({ ...study, title: newStudy.title, abbreviation: newStudy.abbreviation, description: "" });
    }

    setStudyOption(newStudy);
  };

  /**
   * Add a empty publication to the publications state
   *
   * @returns {void}
   */
  const addPublication = () => {
    setPublications([
      ...publications,
      { key: `${publications.length}_${new Date().getTime()}`, title: "", pubmedID: "", DOI: "" },
    ]);
  };

  /**
   * Remove a publication from the publications state
   *
   * @param key generated key for the publication
   */
  const removePublication = (key: string) => {
    setPublications(publications.filter((c) => c.key !== key));
  };

  /**
   * Add a empty repository to the repositories state
   *
   * @returns {void}
   */
  const addRepository = () => {
    setRepositories([
      ...repositories,
      { key: `${repositories.length}_${new Date().getTime()}`, name: "", studyID: "" },
    ]);
  };

  /**
   * Remove a repository from the repositories state
   *
   * @param key generated key for the repository
   */
  const removeRepository = (key: string) => {
    setRepositories(repositories.filter((c) => c.key !== key));
  };

  return (
    <FormContainer
      title="Section B"
      description="Program and Study Registration"
      formRef={formRef}
    >
      {/* Program Registration Section */}
      <SectionGroup title="Provide information about the program" divider={false}>
        <Autocomplete
          gridWidth={12}
          label="Program"
          value={programOption?.isCustom ? programOption.title : program.title}
          onChange={handleProgramChange}
          options={programOptions.map((option: ProgramOption) => option.title)}
          placeholder="– Search and Select Program –"
          required
          disableClearable
        />
        <TextInput
          label="Program name"
          name="program[title]"
          value={programOption?.isCustom ? program.title : programOption.title}
          maxLength={50}
          readOnly={!programOption?.isCustom}
          required
        />
        <TextInput
          label="Program abbreviation or acronym"
          name="program[abbreviation]"
          value={programOption?.isCustom ? program.abbreviation : programOption.abbreviation}
          maxLength={20}
          readOnly={!programOption?.isCustom}
          required
        />
        <TextInput
          label="Program description"
          name="program[description]"
          value={programOption?.isCustom ? program.description : " "}
          gridWidth={12}
          maxLength={500}
          placeholder="500 characters allowed"
          minRows={4}
          readOnly={!programOption?.isCustom}
          required={programOption?.isCustom}
          multiline
        />
      </SectionGroup>

      {/* Study Registration Section */}
      <SectionGroup title="Provide information about the study">
        <Autocomplete
          gridWidth={12}
          label="Study"
          value={studyOption?.isCustom ? studyOption.title : study.title}
          onChange={handleStudyChange}
          options={programOption.studies.map((option: StudyOption) => option.title)}
          placeholder="– Search and Select Study –"
          required
          disableClearable
        />
        <TextInput
          label="Study name"
          name="study[title]"
          value={studyOption?.isCustom ? study.title : studyOption.title}
          maxLength={50}
          readOnly={!studyOption?.isCustom}
          required
        />
        <TextInput
          label="Study abbreviation or acronym"
          name="study[abbreviation]"
          value={studyOption?.isCustom ? study.abbreviation : studyOption.abbreviation}
          maxLength={20}
          readOnly={!studyOption?.isCustom}
          required
        />
        <TextInput
          label="Study description"
          name="study[description]"
          value={studyOption?.isCustom ? study.description : " "}
          gridWidth={12}
          maxLength={500}
          placeholder="500 characters allowed"
          minRows={4}
          readOnly={!studyOption?.isCustom}
          required={studyOption?.isCustom}
          multiline
        />
      </SectionGroup>

      {/* Associated Publications */}
      <SectionGroup
        title={(
          <>
            List publications associated with this study, if any.
            <br />
            Include the PubMed ID (PMID), DOI. Indicate one publication per row.
          </>
        )}
      >
        <Grid item xs={12} className={classes.titleOffset}>
          <Stack direction="row" justifyContent="end">
            <Button
              variant="outlined"
              type="button"
              size="large"
              className={classes.button}
              startIcon={<BookmarkAddIcon />}
              onClick={addPublication}
              disabled={status === FormStatus.SAVING}
            >
              Add Publication
            </Button>
          </Stack>
        </Grid>
        {publications.map((pub: KeyedPublication, idx: number) => (
          <Publication
            key={pub.key}
            index={idx}
            publication={pub}
            onDelete={() => removePublication(pub.key)}
          />
        ))}
      </SectionGroup>

      {/* Study Repositories */}
      <SectionGroup
        title={(
          <>
            Enter name of the repository where the study is currently registered (e.g. dbGaP, ORCID)
            <br />
            and associated repository study identifier.
          </>
        )}
      >
        <Grid item xs={12} className={classes.titleOffset}>
          <Stack direction="row" justifyContent="end">
            <Button
              variant="outlined"
              type="button"
              size="large"
              className={classes.button}
              startIcon={<LabelIcon />}
              onClick={addRepository}
            >
              Add Repository
            </Button>
          </Stack>
        </Grid>
        {repositories.map((repo: KeyedRepository, idx: number) => (
          <Repository
            key={repo.key}
            index={idx}
            repository={repo}
            onDelete={() => removeRepository(repo.key)}
          />
        ))}
      </SectionGroup>

      {/* Funding Agency */}
      <SectionGroup title="List the agency(s) and/or organization(s) that funded this study.">
        <TextInput label="Funding agency" name="funding[agencies][0][name]" value={funding?.agencies[0]?.name} maxLength={100} required />
        <TextInput label="Grant or Contract Number(s)" name="funding[agencies][0][grantNumbers][0]" value={funding?.agencies[0]?.grantNumbers[0]} maxLength={50} required />
        <TextInput label="NCI Program Officer name, if applicable" name="funding[nciProgramOfficer]" value={funding?.nciProgramOfficer} maxLength={50} />
        <TextInput classes={{ label: classes.noWrap }} label="NCI Genomic Program Administrator (GPA) name, if applicable" name="funding[nciGPA]" value={funding?.nciGPA} />
      </SectionGroup>
    </FormContainer>
  );
};

const styles = () => ({
  button: {
    color: "#346798",
    padding: "6px 20px",
    minWidth: "115px",
    borderRadius: "25px",
    border: "2px solid #AFC2D8 !important",
    background: "transparent",
    "text-transform": "none",
    "& .MuiButton-startIcon": {
      marginRight: "14px",
    },
  },
  titleOffset: {
    marginTop: "-70px",
  },
  noWrap: {
    "white-space": "nowrap",
  },
});

export default withStyles(styles, { withTheme: true })(FormSectionB);
