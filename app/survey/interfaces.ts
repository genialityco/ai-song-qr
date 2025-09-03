import type { Timestamp, FieldValue } from "firebase/firestore";

export interface TypeProject {
    updatedAt: Timestamp | FieldValue;
    url: string;
}

export type ProjectsMap = {
    goatHeart?: TypeProject;
    goatMusic?: TypeProject;
    goatBody?: TypeProject;
    [k: string]: TypeProject | undefined;
};

export interface UserDoc {
    LastUpdated: Timestamp | FieldValue;
    phone: string;
    projects: ProjectsMap;
}
