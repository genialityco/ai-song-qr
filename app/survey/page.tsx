// app/survey/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import NextDynamic from "next/dynamic";

const SurveyClient = NextDynamic(() => import("./SurveyClient"), {
  ssr: false,
});

export default function Page() {
  return <SurveyClient />;
}
