export const CANVAS_DIMENSIONS = {
  width: 1280,
  height: 800
} as const;

export type FramePreset = {
  name: string;
  width: number;
  height: number;
};

export type FrameCategory = {
  label: string;
  presets: FramePreset[];
};

export const FRAME_CATEGORIES: FrameCategory[] = [
  {
    label: "Phone",
    presets: [
      { name: "iPhone 15 Pro",  width: 393,  height: 852  },
      { name: "iPhone SE",      width: 375,  height: 667  },
      { name: "Android",        width: 360,  height: 800  },
    ],
  },
  {
    label: "Tablet",
    presets: [
      { name: "iPad",            width: 768,  height: 1024 },
      { name: 'iPad Pro 11"',    width: 834,  height: 1194 },
      { name: 'iPad Pro 12.9"',  width: 1024, height: 1366 },
    ],
  },
  {
    label: "Desktop",
    presets: [
      { name: "MacBook Air",     width: 1280, height: 832  },
      { name: 'MacBook Pro 14"', width: 1512, height: 982  },
      { name: 'MacBook Pro 16"', width: 1728, height: 1117 },
      { name: "Desktop",         width: 1440, height: 1024 },
      { name: "Wireframes",      width: 1440, height: 1024 },
      { name: "TV",              width: 1280, height: 720  },
    ],
  },
  {
    label: "Presentation",
    presets: [
      { name: "Slide 16:9",  width: 1920, height: 1080 },
      { name: "Slide 4:3",   width: 1024, height: 768  },
    ],
  },
  {
    label: "Watch",
    presets: [
      { name: "Apple Watch 41mm", width: 352, height: 430 },
      { name: "Apple Watch 45mm", width: 396, height: 484 },
    ],
  },
  {
    label: "Paper",
    presets: [
      { name: "A4",     width: 794,  height: 1123 },
      { name: "Letter", width: 816,  height: 1056 },
      { name: "A3",     width: 1123, height: 1587 },
    ],
  },
  {
    label: "Social media",
    presets: [
      { name: "Instagram Post",  width: 1080, height: 1080 },
      { name: "Instagram Story", width: 1080, height: 1920 },
      { name: "Twitter Post",    width: 1200, height: 675  },
      { name: "Facebook Cover",  width: 820,  height: 312  },
    ],
  },
];
