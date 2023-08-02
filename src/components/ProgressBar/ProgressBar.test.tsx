import React, { FC, useMemo } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import config from '../../config/SectionConfig';
import ProgressBar from './ProgressBar';
import {
  ContextState as FormCtxState,
  Context as FormCtx,
  Status as FormStatus,
} from '../Contexts/FormContext';
import {
  ContextState,
  Context as AuthCtx,
  Status as AuthStatus,
} from '../Contexts/AuthContext';

type Props = {
  section: string;
  data: object;
};

const BaseComponent: FC<Props> = ({ section, data = {} } : Props) => {
  const formValue = useMemo<FormCtxState>(() => ({
    data: data as Application, status: FormStatus.LOADED
  }), [data]);

  const authValue = useMemo<ContextState>(() => ({
    status: AuthStatus.LOADED,
    user: null,
    isLoggedIn: true,
  }), []);

  return (
    <BrowserRouter>
      <AuthCtx.Provider value={authValue}>
        <FormCtx.Provider value={formValue}>
          <ProgressBar section={section} />
        </FormCtx.Provider>
      </AuthCtx.Provider>
    </BrowserRouter>
  );
};

describe("ProgressBar General Tests", () => {
  const keys = Object.keys(config);
  const sections = Object.values(config);

  it("renders the progress bar with all config-defined sections", () => {
    const screen = render(<BaseComponent section={keys[0]} data={{}} />);

    sections.forEach(({ id, title }, index) => {
      const isReviewSection = id === "review";
      const root = screen.getByText(isReviewSection ? title || "Review" : title).closest("a");

      expect(root).toBeVisible();
      expect(root).toHaveAttribute("data-testId", `progress-bar-section-${index}`);
      expect(root).toHaveAttribute("href");
      expect(root).toHaveAttribute("aria-disabled");
    });
  });

  it("renders the currently active section as highlighted", () => {
    const { container, getByTestId } = render(<BaseComponent section={keys[1]} data={{}} />);
    const activeLinks = container.querySelectorAll("a[aria-selected='true']");

    expect(activeLinks.length).toBe(1);
    expect(activeLinks[0]).toBe(getByTestId("progress-bar-section-1"));
    expect(activeLinks[0].querySelector(".MuiButtonBase-root")).toHaveClass("Mui-selected");
  });

  it("renders the completed sections with a checkmark", () => {
    const data = {
      sections: [
        { name: keys[1], status: "Completed" },
      ],
    };

    const { getByTestId } = render(<BaseComponent section={keys[0]} data={data} />);
    const element = getByTestId("progress-bar-section-1");

    expect(element.querySelector(".MuiAvatar-root svg")).toHaveAttribute("data-testid", "CheckIcon");
  });

  it("renders the Review section as disabled by default", () => {
    const { getByTestId } = render(<BaseComponent section={keys[0]} data={{}} />);
    const reviewSection = getByTestId(`progress-bar-section-${keys.length - 1}`);

    expect(reviewSection).toBeVisible();
    expect(reviewSection).toHaveAttribute("aria-disabled", "true");
    expect(reviewSection.querySelector(".MuiAvatar-root svg")).toHaveAttribute("data-testid", "ArrowUpwardIcon");
  });

  it("renders the Review section as enabled only when all sections are completed", () => {
    const data = {
      sections: keys.slice(0, keys.length - 1).map((s) => ({ name: s, status: "Completed" })),
    };

    const { getByTestId } = render(<BaseComponent section={keys[0]} data={data} />);

    sections.slice(0, sections.length - 1).forEach((_, index) => {
      const sectionLink = getByTestId(`progress-bar-section-${index}`);
      expect(sectionLink).toHaveAttribute("aria-disabled", "false");
      expect(sectionLink.querySelector(".MuiAvatar-root svg")).toHaveAttribute("data-testid", "CheckIcon");
    });

    expect(getByTestId(`progress-bar-section-${keys.length - 1}`)).toHaveAttribute("aria-disabled", "false");
  });

  const completedStates : ApplicationStatus[] = ["Approved"];
  it.each(completedStates)("renders the Review section as accessible and completed for status %s", (status) => {
    const data = {
      sections: keys.slice(0, keys.length - 1).map((s) => ({ name: s, status: "Completed" })),
      status,
    };

    const { getByTestId } = render(<BaseComponent section={keys[0]} data={data} />);
    const reviewSection = getByTestId(`progress-bar-section-${keys.length - 1}`);

    expect(reviewSection.querySelector(".MuiAvatar-root svg")).toHaveAttribute("data-testid", "CheckIcon");
  });

  const incompleteStates : ApplicationStatus[] = ["New", "In Progress", "Submitted", "In Review", "Rejected"];
  it.each(incompleteStates)("renders the Review section as accessible and incomplete for status %s", (status) => {
    const data = {
      sections: keys.slice(0, keys.length - 1).map((s) => ({ name: s, status: "Completed" })),
      status,
    };

    const { getByTestId } = render(<BaseComponent section={keys[0]} data={data} />);
    const reviewSection = getByTestId(`progress-bar-section-${keys.length - 1}`);

    expect(reviewSection.querySelector(".MuiAvatar-root svg")).toHaveAttribute("data-testid", "ArrowUpwardIcon");
  });
});
