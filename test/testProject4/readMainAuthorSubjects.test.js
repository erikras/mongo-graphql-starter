import spinUp from "./spinUp";

let db, schema, queryAndMatchArray, runMutation;
beforeAll(async () => {
  ({ db, schema, queryAndMatchArray, runMutation } = await spinUp());

  let js = { name: "JavaScript" };
  let af = { name: "Air Force" };
  let lit = { name: "Literature" };

  await Promise.all([js, af, lit].map(subject => db.collection("subjects").insert(subject)));

  let adam = { name: "Adam", birthday: new Date("1982-03-22"), subjectIds: ["" + js._id] };
  let katie = { name: "Katie", birthday: new Date("2009-08-05") };
  let laura = { name: "Laura", birthday: new Date("1974-12-19"), subjectIds: ["" + af._id] };
  let mallory = { name: "Mallory", birthday: new Date("1956-08-02"), subjectIds: ["" + lit._id] };

  await Promise.all([adam, katie, laura, mallory].map(person => db.collection("authors").insert(person)));

  await db.collection("books").insert({ title: "Book 1", pages: 100, mainAuthorId: "" + adam._id });
  await db.collection("books").insert({ title: "Book 2", pages: 150, mainAuthorId: "" + adam._id });
  await db.collection("books").insert({ title: "Book 3", pages: 200, mainAuthorId: "" + mallory._id });
});

afterAll(async () => {
  await db.collection("books").remove({});
  await db.collection("authors").remove({});
  await db.collection("subjects").remove({});
  db.close();
  db = null;
});

test("Read authors with subjects", async () => {
  await queryAndMatchArray({
    query: `{allBooks(title_startsWith: "B"){Books{title, mainAuthor{name, subjects{name}}}}}`,
    coll: "allBooks",
    results: [
      { title: "Book 1", mainAuthor: { name: "Adam", subjects: [{ name: "JavaScript" }] } },
      { title: "Book 2", mainAuthor: { name: "Adam", subjects: [{ name: "JavaScript" }] } },
      { title: "Book 3", mainAuthor: { name: "Mallory", subjects: [{ name: "Literature" }] } }
    ]
  });
});
