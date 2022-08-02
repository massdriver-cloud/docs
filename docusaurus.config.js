module.exports = {
  title: 'Massdriver Docs',
  tagline: 'Effortless DevOps',
  url: 'https://docs.massdriver.cloud',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'massdriver-cloud',
  projectName: 'docs',
  themeConfig: {
    prism: {
      additionalLanguages: ['yaml', 'hcl', 'shell-session'],
    },
    navbar: {
      title: 'Massdriver',
      logo: {
        alt: 'Jimmy @ Massdriver',
        src: 'img/logo.png',
      },
      items: [
        {
          to: "/swapi", // adjust the location depending on your baseURL (see configuration)
          label: "GraphQL Schema", // change the label with yours
          position: "left",
        },
        {
          href: 'https://community.massdriver.cloud',
          label: 'Community',
          position: 'right',
        },
        {
          href: 'https://github.com/massdriver-cloud',
          label: 'GitHub',
          position: 'right',
        }
      ],
    },
    footer: {
      style: 'dark',
      links: [
        // {
        //   title: 'We can put links to most popular doc pages here',
        //   items: [
        //     {
        //       label: 'Style Guide',
        //       to: 'docs/doc1',
        //     },
        //     {
        //       label: 'Second Doc',
        //       to: 'docs/doc2',
        //     },
        //   ],
        // },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/massdriver',
            },
            {
              href: 'https://community.massdriver.cloud',
              label: 'Community',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/massdriver',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              href: 'https://blog.massdriver.cloud',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/massdriver-cloud',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Massdriver, Inc.`,
    },
  },
  plugins: [
    [
      "@edno/docusaurus2-graphql-doc-generator",
      {
        schema: "./schema/md.graphql",
        rootPath: "./docs", // docs will be generated under './docs/swapi' (rootPath/baseURL)
        baseURL: "swapi",
        homepage: "./docs/swapi.md",
      },
    ],
  ],
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/massdriver-cloud/docs/edit/main/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
