'use strict';

/** Java Edition versions supported by cubiomes wasm */
const VERSION_GROUPS = [
  {
    label: 'Latest',
    items: [
      { id: 'java-26.2', label: 'Java 26.2', major: 26, minor: 2, patch: 0 },
      { id: 'java-26.1', label: 'Java 26.1', major: 26, minor: 1, patch: 0 },
      { id: 'java-1.21.5', label: 'Java 1.21.5', major: 1, minor: 21, patch: 5 },
      { id: 'java-1.21', label: 'Java 1.21', major: 1, minor: 21, patch: 0 }
    ]
  },
  {
    label: 'Java 1.20',
    items: [
      { id: 'java-1.20.6', label: 'Java 1.20.6', major: 1, minor: 20, patch: 6 },
      { id: 'java-1.20', label: 'Java 1.20', major: 1, minor: 20, patch: 0 }
    ]
  },
  {
    label: 'Java 1.19',
    items: [
      { id: 'java-1.19.4', label: 'Java 1.19.4', major: 1, minor: 19, patch: 4 },
      { id: 'java-1.19', label: 'Java 1.19', major: 1, minor: 19, patch: 0 }
    ]
  },
  {
    label: 'Java 1.18',
    items: [
      { id: 'java-1.18.2', label: 'Java 1.18.2', major: 1, minor: 18, patch: 2 },
      { id: 'java-1.18', label: 'Java 1.18', major: 1, minor: 18, patch: 0 }
    ]
  },
  {
    label: 'Java 1.17',
    items: [{ id: 'java-1.17', label: 'Java 1.17', major: 1, minor: 17, patch: 0 }]
  },
  {
    label: 'Java 1.16',
    items: [{ id: 'java-1.16', label: 'Java 1.16', major: 1, minor: 16, patch: 0 }]
  },
  {
    label: 'Java 1.15',
    items: [{ id: 'java-1.15', label: 'Java 1.15', major: 1, minor: 15, patch: 0 }]
  },
  {
    label: 'Java 1.14',
    items: [{ id: 'java-1.14', label: 'Java 1.14', major: 1, minor: 14, patch: 0 }]
  },
  {
    label: 'Java 1.13',
    items: [{ id: 'java-1.13', label: 'Java 1.13', major: 1, minor: 13, patch: 0 }]
  },
  {
    label: 'Java 1.12',
    items: [{ id: 'java-1.12', label: 'Java 1.12', major: 1, minor: 12, patch: 0 }]
  },
  {
    label: 'Java 1.11',
    items: [{ id: 'java-1.11', label: 'Java 1.11', major: 1, minor: 11, patch: 0 }]
  },
  {
    label: 'Java 1.10',
    items: [{ id: 'java-1.10', label: 'Java 1.10', major: 1, minor: 10, patch: 0 }]
  },
  {
    label: 'Java 1.9',
    items: [{ id: 'java-1.9', label: 'Java 1.9', major: 1, minor: 9, patch: 0 }]
  },
  {
    label: 'Java 1.8',
    items: [{ id: 'java-1.8', label: 'Java 1.8', major: 1, minor: 8, patch: 0 }]
  },
  {
    label: 'Java 1.7',
    items: [{ id: 'java-1.7.10', label: 'Java 1.7.10', major: 1, minor: 7, patch: 10 }]
  }
];

const VERSION_BY_ID = new Map();
for (const group of VERSION_GROUPS) {
  for (const item of group.items) {
    VERSION_BY_ID.set(item.id, item);
  }
}

function getVersion(versionId) {
  return VERSION_BY_ID.get(versionId) || VERSION_GROUPS[0].items[0];
}

module.exports = { VERSION_GROUPS, getVersion };
