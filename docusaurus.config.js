module.exports = {
  title: 'Massdriver Docs',
  tagline: 'The Future of Platform Engineering',
  url: 'https://docs.massdriver.cloud',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'massdriver-cloud',
  projectName: 'docs',
  themeConfig: {
    image: 'img/opengraph-md.png',
    metadata: [{ name: 'twitter:card', content: 'summary' }],
    announcementBar: {
      id: 'were_hiring',
      content:
      "<img src='https://cdn.prod.website-files.com/649d16db05505718a723b2df/66eaf73661941beac89c892e_Tofu-color-dark.png'>OpenTofu Foundations - A FREE Weekly Workshop to Build your IaC Skills - LIMITED AVAILABILITY  <a target='_blank' rel='noopener noreferrer' href='https://www.massdriver.cloud/blogs/opentofu-foundations---a-free-weekly-workshop-to-build-your-iac-skills'>Register Now!</a>",
      backgroundColor: '#fafbfc',
      textColor: '#091E42',
      isCloseable: false,
    },
    metadata: [{ name: 'keywords', content: 'massdriver, mass driver, internal developer platform, ' }],
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
          to: "/swapi",
          label: "GraphQL API",
          position: "left",
        },
        {
          href: 'https://roadmap.massdriver.cloud/',
          label: 'Roadmap',
          position: 'right',
        },
        {
          href: 'https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1smvckvdj-jVFpBG2jF5XiYzX2njDCWA',
          label: 'Slack',
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
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/massdriver',
            },
            {
              href: 'https://roadmap.massdriver.cloud/',
              label: 'Roadmap',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/massdriver',
            },
            {
              label: 'Slack',
              href: 'https://join.slack.com/t/massdrivercommunity/shared_invite/zt-1smvckvdj-jVFpBG2jF5XiYzX2njDCWA',
            }
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'YouTube Demos & Quick Starts',
              href: 'https://www.youtube.com/channel/UCfj8P7MJcdlem2DJpvymtaQ'
            },
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
      // https://github.com/cmfcmf/docusaurus-search-local
      "@cmfcmf/docusaurus-search-local",
      {
        indexDocs: true,
        indexBlog: false
      }
    ],
    [
      "@edno/docusaurus2-graphql-doc-generator",
      {
        schema: "./schema/md.graphql",
        rootPath: "./docs", // docs will be generated under './docs/swapi' (rootPath/baseURL)
        baseURL: "swapi",
        homepage: "./docs/swapi.md",
      },
    ],
    [
      "posthog-docusaurus",
      {
        apiKey: "phc_BZ07WXSgkr8JqwgfZoZOga1C7twF2jOcCc6rmaQF2aY",
        appUrl: "https://app.posthog.com", // optional
        enableInDevelopment: false, // optional
        // other options are passed to posthog-js init as is
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
        gtag: {
          trackingID: 'G-8SSC1M0KC7',
          anonymizeIP: true,
        },
        googleTagManager: {
          containerId: 'GTM-KCXLG6S',
        },
      },
    ],
  ],
  scripts: [
    {
      src:
        '/js/chatwoot.js',
      async: true,
    },
  ],
};
