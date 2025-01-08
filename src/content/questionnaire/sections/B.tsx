import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { parseForm } from "@jalik/form-parser";
import { cloneDeep } from "lodash";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import dayjs from "dayjs";
import { Status as FormStatus, useFormContext } from "../../../components/Contexts/FormContext";
import FormContainer from "../../../components/Questionnaire/FormContainer";
import SectionGroup from "../../../components/Questionnaire/SectionGroup";
import TextInput from "../../../components/Questionnaire/TextInput";
import Publication from "../../../components/Questionnaire/Publication";
import Repository from "../../../components/Questionnaire/Repository";
import {
  filterAlphaNumeric,
  findProgram,
  Logger,
  mapObjectWithKey,
  validateEmoji,
} from "../../../utils";
import AddRemoveButton from "../../../components/AddRemoveButton";
import PlannedPublication from "../../../components/Questionnaire/PlannedPublication";
import { InitialQuestionnaire } from "../../../config/InitialValues";
import TransitionGroupWrapper from "../../../components/Questionnaire/TransitionGroupWrapper";
import useFormMode from "../../../hooks/useFormMode";
import FundingAgency from "../../../components/Questionnaire/FundingAgency";
import SelectInput from "../../../components/Questionnaire/SelectInput";
import SectionMetadata from "../../../config/SectionMetadata";
import { useOrganizationListContext } from "../../../components/Contexts/OrganizationListContext";
import { NotApplicableProgram, OtherProgram } from "../../../config/ProgramConfig";

export type KeyedPublication = {
  key: string;
} & Publication;

export type KeyedPlannedPublication = {
  key: string;
} & PlannedPublication;

export type KeyedRepository = {
  key: string;
} & Repository;

export type KeyedFunding = {
  key: string;
} & Funding;

/**
 * Form Section B View
 *
 * @param {FormSectionProps} props
 * @returns {JSX.Element}
 */
const FormSectionB: FC<FormSectionProps> = ({ SectionOption, refs }: FormSectionProps) => {
  const {
    status,
    data: { questionnaireData: data },
  } = useFormContext();
  const { data: programs } = useOrganizationListContext();
  const { readOnlyInputs } = useFormMode();
  const { B: SectionBMetadata } = SectionMetadata;

  const [program, setProgram] = useState<ProgramInput>(null);
  const [study] = useState<Study>(data.study);
  const [publications, setPublications] = useState<KeyedPublication[]>(
    data.study?.publications?.map(mapObjectWithKey) || []
  );
  const [plannedPublications, setPlannedPublications] = useState<KeyedPlannedPublication[]>(
    data.study?.plannedPublications?.map(mapObjectWithKey) || []
  );
  const [repositories, setRepositories] = useState<KeyedRepository[]>(
    data.study?.repositories?.map(mapObjectWithKey) || []
  );
  const [fundings, setFundings] = useState<KeyedFunding[]>(
    data.study?.funding?.map(mapObjectWithKey) || []
  );

  const customProgramIds: string[] = [NotApplicableProgram._id, OtherProgram._id];
  const programKeyRef = useRef(new Date().getTime());
  const formContainerRef = useRef<HTMLDivElement>();
  const formRef = useRef<HTMLFormElement>();
  const { getFormObjectRef } = refs;

  useEffect(() => {
    if (!programs?.length) {
      return;
    }

    setProgram(findProgram(data?.program, programs));
  }, [programs]);

  const getFormObject = (): FormObject | null => {
    if (!formRef.current) {
      return null;
    }

    const formObject = parseForm(formRef.current, { nullify: false });
    const combinedData = { ...cloneDeep(data), ...formObject };

    // Reset study if the data failed to load
    if (!formObject.study) {
      combinedData.study = InitialQuestionnaire.study;
    }

    // Reset publications if the user has not entered any publications
    if (!formObject.study.publications || formObject.study.publications.length === 0) {
      combinedData.study.publications = [];
    }

    // Reset repositories if the user has not entered any repositories
    if (!formObject.study.repositories || formObject.study.repositories.length === 0) {
      combinedData.study.repositories = [];
    }

    // Reset planned publications if the user has not entered any planned publications
    // Also reset expectedDate when invalid to avoid form submission unsaved changes warning
    combinedData.study.plannedPublications =
      combinedData.study.plannedPublications?.map((plannedPublication) => ({
        ...plannedPublication,
        expectedDate: dayjs(plannedPublication.expectedDate).isValid()
          ? plannedPublication.expectedDate
          : "",
      })) || [];

    combinedData.study = {
      // Restore dbGaPID from Section C
      isDbGapRegistered: data?.study?.isDbGapRegistered,
      dbGaPPPHSNumber: data?.study?.dbGaPPPHSNumber,
      ...combinedData.study,
    };

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
  const handleProgramChange = (value: string) => {
    if (program?._id === value) {
      return;
    }

    const allProgramOptions = [NotApplicableProgram, ...programs, OtherProgram];
    const newProgram = allProgramOptions.find((program) => program._id === value);
    if (!newProgram?._id) {
      Logger.error(`B.tsx: Unable to change program due to invalid ID.`);
      return;
    }
    programKeyRef.current = new Date().getTime();

    if (newProgram?._id === NotApplicableProgram._id || newProgram?._id === OtherProgram._id) {
      setProgram({
        _id: newProgram._id,
        name: "",
        abbreviation: "",
        description: "",
      });
      return;
    }

    setProgram({
      _id: newProgram._id,
      name: newProgram?.name || "",
      abbreviation: newProgram?.abbreviation || "",
      description: newProgram?.description || "",
    });
  };

  /**
   * Add a empty publication to the publications state
   *
   * @returns {void}
   */
  const addPublication = () => {
    setPublications([
      ...publications,
      {
        key: `${publications.length}_${new Date().getTime()}`,
        title: "",
        pubmedID: "",
        DOI: "",
      },
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
   * Add a empty planned publication to the planned publications state
   *
   * @returns {void}
   */
  const addPlannedPublication = () => {
    setPlannedPublications([
      ...plannedPublications,
      {
        key: `${plannedPublications.length}_${new Date().getTime()}`,
        title: "",
        expectedDate: dayjs().format("MM/DD/YYYY"),
      },
    ]);
  };

  /**
   * Remove a planned publication from the planned publications state
   *
   * @param key generated key for the planned publication
   */
  const removePlannedPublication = (key: string) => {
    setPlannedPublications(plannedPublications.filter((c) => c.key !== key));
  };

  /**
   * Add a empty repository to the repositories state
   *
   * @returns {void}
   */
  const addRepository = () => {
    setRepositories([
      ...repositories,
      {
        key: `${repositories.length}_${new Date().getTime()}`,
        name: "",
        studyID: "",
        dataTypesSubmitted: [],
        otherDataTypesSubmitted: "",
      },
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

  /**
   * Add a empty funding to the fundings state
   *
   * @returns {void}
   */
  const addFunding = () => {
    setFundings([
      ...fundings,
      {
        key: `${fundings.length}_${new Date().getTime()}`,
        agency: "",
        grantNumbers: "",
        nciProgramOfficer: "",
        nciGPA: "",
      },
    ]);
  };

  /**
   * Remove a funding from the fundings state
   *
   * @param key generated key for the funding
   */
  const removeFunding = (key: string) => {
    setFundings(fundings.filter((f) => f.key !== key));
  };

  /**
   *  Uses a form program to create a label
   *
   * @param program The form program that will be used to create the label
   * @returns A label with the program name and abbreviation, if available. Otherwise an empty string.
   */
  const formatProgramLabel = (program: ProgramInput) => {
    if (!program) {
      return "";
    }
    if (customProgramIds.includes(program._id)) {
      return program._id;
    }

    return `${program.name || ""}${
      program.abbreviation ? ` (${program.abbreviation.toUpperCase()})` : ""
    }`?.trim();
  };

  useEffect(() => {
    getFormObjectRef.current = getFormObject;
  }, [refs]);

  useEffect(() => {
    formContainerRef.current?.scrollIntoView({ block: "start" });
  }, []);

  const allProgramOptions = useMemo(
    () => [NotApplicableProgram, ...programs, OtherProgram],
    [NotApplicableProgram, OtherProgram, programs]
  );
  const readOnlyProgram = readOnlyInputs || program?._id !== OtherProgram._id;

  return (
    <FormContainer ref={formContainerRef} formRef={formRef} description={SectionOption.title}>
      {/* Program Registration Section */}
      <SectionGroup
        title={SectionBMetadata.sections.PROGRAM_INFORMATION.title}
        description={SectionBMetadata.sections.PROGRAM_INFORMATION.description}
      >
        <SelectInput
          id="section-b-program"
          label="Program"
          name="program[_id]"
          options={allProgramOptions.map((program) => ({
            label: formatProgramLabel(program),
            value: program._id,
          }))}
          value={program?._id}
          onChange={handleProgramChange}
          placeholder="Select a program"
          gridWidth={12}
          tooltipText="The name of the broad administrative group that manages the data collection.  Example - Clinical Proteomic Tumor Analysis Consortium."
          required
          readOnly={readOnlyInputs}
        />
        <TextInput
          key={`program-name-${program?.name}_${programKeyRef.current}`}
          id="section-b-program-title"
          label="Program Title"
          name="program[name]"
          value={program?.name}
          maxLength={100}
          placeholder="100 characters allowed"
          hideValidation={readOnlyProgram}
          required
          readOnly={readOnlyProgram}
        />
        <TextInput
          key={`program-abbreviation-${program?.abbreviation}_${programKeyRef.current}`}
          id="section-b-program-abbreviation"
          label="Program Abbreviation"
          name="program[abbreviation]"
          value={program?.abbreviation}
          filter={(input: string) => filterAlphaNumeric(input, "- ")}
          onChange={(e) => {
            e.target.value = e.target.value.toUpperCase();
          }}
          maxLength={100}
          placeholder="100 characters allowed"
          hideValidation={readOnlyProgram}
          required
          readOnly={readOnlyProgram}
        />
        <TextInput
          key={`program-description-${program?.description}_${programKeyRef.current}`}
          id="section-b-program-description"
          label="Program Description"
          name="program[description]"
          value={program?.description}
          gridWidth={12}
          maxLength={500}
          placeholder="500 characters allowed"
          rows={4}
          hideValidation={readOnlyProgram}
          multiline
          resize
          required
          readOnly={readOnlyProgram}
        />
      </SectionGroup>

      {/* Study Registration Section */}
      <SectionGroup
        title={SectionBMetadata.sections.STUDY_INFORMATION.title}
        description={SectionBMetadata.sections.STUDY_INFORMATION.description}
      >
        <TextInput
          id="section-b-study-title"
          label="Study Title"
          name="study[name]"
          value={study.name}
          maxLength={100}
          placeholder="100 characters allowed"
          validate={(input: string) => !validateEmoji(input)}
          readOnly={readOnlyInputs}
          hideValidation={readOnlyInputs}
          tooltipText="A descriptive name that will be used to identify the study."
          required
        />
        <TextInput
          id="section-b-study-abbreviation-or-acronym"
          label="Study Abbreviation"
          name="study[abbreviation]"
          value={study.abbreviation}
          filter={(input: string) => filterAlphaNumeric(input, "- ")}
          onChange={(e) => {
            e.target.value = e.target.value.toUpperCase();
          }}
          maxLength={20}
          placeholder="20 characters allowed"
          readOnly={readOnlyInputs}
          hideValidation={readOnlyInputs}
          tooltipText="Provide a short abbreviation or acronym (e.g., NCI-MATCH) for the study."
        />
        <TextInput
          id="section-b-study-description"
          label="Study Description"
          name="study[description]"
          value={study.description}
          gridWidth={12}
          maxLength={2500}
          placeholder="2,500 characters allowed"
          rows={4}
          readOnly={readOnlyInputs}
          hideValidation={readOnlyInputs}
          required
          multiline
          resize
          tooltipText="Describe your study and the data being submitted. Include objectives of the study and provide a brief description of the scientific value of the study."
        />
      </SectionGroup>

      {/* Funding Agency */}
      <SectionGroup
        title={SectionBMetadata.sections.FUNDING_AGENCY.title}
        description={SectionBMetadata.sections.FUNDING_AGENCY.description}
        endButton={
          <AddRemoveButton
            id="section-b-add-funding-agency-button"
            label="Add Agency"
            startIcon={<AddCircleIcon />}
            onClick={addFunding}
            disabled={readOnlyInputs || status === FormStatus.SAVING}
          />
        }
      >
        <TransitionGroupWrapper
          items={fundings}
          renderItem={(funding: KeyedFunding, idx: number) => (
            <FundingAgency
              idPrefix="section-b-"
              index={idx}
              funding={funding}
              onDelete={() => removeFunding(funding.key)}
              readOnly={readOnlyInputs}
            />
          )}
        />
      </SectionGroup>

      {/* Existing Publications */}
      <SectionGroup
        title={SectionBMetadata.sections.EXISTING_PUBLICATIONS.title}
        description={SectionBMetadata.sections.EXISTING_PUBLICATIONS.description}
        endButton={
          <AddRemoveButton
            id="section-b-add-publication-button"
            label="Add Existing Publication"
            startIcon={<AddCircleIcon />}
            onClick={addPublication}
            disabled={readOnlyInputs || status === FormStatus.SAVING}
          />
        }
      >
        <TransitionGroupWrapper
          items={publications}
          renderItem={(pub: KeyedPublication, idx: number) => (
            <Publication
              idPrefix="section-b-"
              index={idx}
              publication={pub}
              onDelete={() => removePublication(pub.key)}
              readOnly={readOnlyInputs}
            />
          )}
        />
      </SectionGroup>

      {/* Planned Publications */}
      <SectionGroup
        title={SectionBMetadata.sections.PLANNED_PUBLICATIONS.title}
        description={SectionBMetadata.sections.PLANNED_PUBLICATIONS.description}
        endButton={
          <AddRemoveButton
            id="section-b-add-planned-publication-button"
            label="Add Planned Publication"
            startIcon={<AddCircleIcon />}
            onClick={addPlannedPublication}
            disabled={readOnlyInputs || status === FormStatus.SAVING}
          />
        }
      >
        <TransitionGroupWrapper
          items={plannedPublications}
          renderItem={(pub: KeyedPlannedPublication, idx: number) => (
            <PlannedPublication
              idPrefix="section-b-"
              index={idx}
              plannedPublication={pub}
              onDelete={() => removePlannedPublication(pub.key)}
              readOnly={readOnlyInputs}
            />
          )}
        />
      </SectionGroup>

      {/* Study Repositories */}
      <SectionGroup
        title={SectionBMetadata.sections.REPOSITORY.title}
        description={SectionBMetadata.sections.REPOSITORY.description}
        endButton={
          <AddRemoveButton
            id="section-b-add-repository-button"
            label="Add Repository"
            startIcon={<AddCircleIcon />}
            onClick={addRepository}
            disabled={readOnlyInputs || status === FormStatus.SAVING}
          />
        }
      >
        <TransitionGroupWrapper
          items={repositories}
          renderItem={(repo: KeyedRepository, idx: number) => (
            <Repository
              idPrefix="section-b-"
              index={idx}
              repository={repo}
              onDelete={() => removeRepository(repo.key)}
              readOnly={readOnlyInputs}
            />
          )}
        />
      </SectionGroup>
    </FormContainer>
  );
};

export default FormSectionB;
