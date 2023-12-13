import { FC } from 'react';
import { styled } from '@mui/material';
import Carousel, { CarouselProps } from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

type Props = {
  children: React.ReactNode;
} & Partial<CarouselProps>;

const sizing = {
  desktop: {
    breakpoint: { max: 5000, min: 0 },
    items: 3,
    partialVisibilityGutter: 40
  },
};

const StyledWrapper = styled('div')({
  maxWidth: "700px",
  minWidth: "464px", // NOTE: Without a min-width, the carousel collapses to 0px wide
  width: "100%",
  margin: "0 auto",
  "& .react-multi-carousel-list": {
    height: "206px",
  },
  "& .react-multi-carousel-track": {
    margin: "0 auto", // NOTE: This centers the carousel when there are fewer than 2 items
  },
  "& .react-multi-carousel-item": {
    width: "200px !important",
  },
  "& .react-multi-carousel-list::after": {
    content: "''",
    position: "absolute",
    left: "calc(100% - 162px)",
    top: "0",
    bottom: "0",
    width: "162px",
    background: "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50%)",
    zIndex: 9,
  },
  "& .react-multi-carousel-list::before": {
    content: "''",
    position: "absolute",
    right: "calc(100% - 162px)",
    top: "0",
    bottom: "0",
    width: "162px",
    background: "linear-gradient(to left, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50%)",
    zIndex: 9,
  },
});

/**
 * Provides a general carousel component for displaying multiple items
 * at the same time.
 *
 * @param Props
 * @returns {JSX.Element}
 */
const ContentCarousel: FC<Props> = ({ children, ...props }: Props) => (
  <StyledWrapper>
    <Carousel
      responsive={sizing}
      swipeable
      draggable
      infinite
      centerMode
      arrows
      focusOnSelect
      {...props}
    >
      {children}
    </Carousel>
  </StyledWrapper>
);

export default ContentCarousel;
