export type Citation = {
  abbreviation: string;
  name: string;
  copyrightYear: string;
  organization: string;
  publisherUrl: string;
  providerName: string;
  providerUrl: string;
};

export const citation: Citation = {
  abbreviation: process.env.NEXT_PUBLIC_BIBLE_ABBREVIATION || "NIV",
  name: process.env.NEXT_PUBLIC_BIBLE_NAME || "New International Version",
  copyrightYear: process.env.NEXT_PUBLIC_BIBLE_COPYRIGHT_YEAR || "1973, 1978, 1984, 2011",
  organization: process.env.NEXT_PUBLIC_BIBLE_ORGANIZATION || "Biblica, Inc.®",
  publisherUrl: process.env.NEXT_PUBLIC_BIBLE_PUBLISHER_URL || "https://www.biblica.com",
  providerName: process.env.NEXT_PUBLIC_BIBLE_PROVIDER_NAME || "API.Bible",
  providerUrl: process.env.NEXT_PUBLIC_BIBLE_PROVIDER_URL || "https://api.bible",
};

export function citationText(c: Citation = citation): string {
  return (
    `Scripture quotations marked ${c.abbreviation} © are taken from the ` +
    `${c.name} ©, Copyright ${c.copyrightYear} ${c.organization}. ` +
    `Used by permission. All rights reserved. ` +
    `The ${c.abbreviation} text may not be quoted in any publication made ` +
    `available to the public by a Creative Commons license. ` +
    `The ${c.abbreviation} may not be translated into any other language. ` +
    `Website: ${c.publisherUrl}`
  );
}
