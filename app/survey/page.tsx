// app/survey/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import SurveyClient from "./SurveyClient"; // import directo

export default function Page() {
  return <SurveyClient />;
}
