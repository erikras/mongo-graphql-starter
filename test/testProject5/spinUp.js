import { MongoClient } from "mongodb";
import { queryAndMatchArray, runQuery, runMutation, nextConnectionString } from "../testUtil";
import { makeExecutableSchema } from "graphql-tools";
import { createGraphqlSchema } from "../../src/module";
import path from "path";
import glob from "glob";
import fs from "fs";

import projectSetupE from "./projectSetup";

export async function create() {
  await Promise.resolve(createGraphqlSchema(projectSetupE, path.resolve("./test/testProject5"))).then(() => {
    fs.writeFileSync(
      path.resolve("./test/testProject5/graphQL/hooks.js"),
      fs.readFileSync(path.resolve(__dirname, "./projectSetup_Hooks.js"), { encoding: "utf8" })
    );

    if (true || process.env.InCI) {
      glob.sync("./test/testProject5/graphQL/**/resolver.js").forEach(f => {
        let newFile = fs.readFileSync(f, { encoding: "utf8" }).replace(/"mongo-graphql-starter"/, `"../../../../src/module"`);
        fs.writeFileSync(f, newFile);
      });
    }
  });
}

export default async function() {
  await create();

  const [{ default: resolvers }, { default: typeDefs }] = await Promise.all([import("./graphQL/resolver"), import("./graphQL/schema")]);

  let db, schema;
  db = await MongoClient.connect(nextConnectionString());
  schema = makeExecutableSchema({ typeDefs, resolvers, initialValue: { db: {} } });

  return {
    db,
    schema,
    queryAndMatchArray: options => queryAndMatchArray({ schema, db, ...options }),
    runQuery: options => runQuery({ schema, db, ...options }),
    runMutation: options => runMutation({ schema, db, ...options })
  };
}
