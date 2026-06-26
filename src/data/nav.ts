export type NavLink = { icon: string; text: string; href: string };
export type NavSection = { label: string; links: NavLink[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Reference",
    links: [
      {
        icon: "description",
        text: "Product Brief",
        href: "https://github.com/kelvinxxle/algoviz/blob/main/docs/prd.md",
      },
      {
        icon: "palette",
        text: "Design System",
        href: "https://github.com/kelvinxxle/algoviz/tree/main/docs/design",
      },
      {
        icon: "code",
        text: "Source",
        href: "https://github.com/kelvinxxle/algoviz",
      },
    ],
  },
];
