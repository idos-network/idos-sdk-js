import { describe, expect, test } from "vitest";

import { ActionInput } from "../core/action";

describe("ActionBuilder + ActionInput + Transaction public methods & broadcasting an action Transaction", () => {
  const recordCount = 1;
  let actionInput: ActionInput = new ActionInput();
  let actionInputArr: ActionInput[];
  const id = 1;
  const user = "Luke";
  const title = "Test Post";
  const body = "This is a test post";

  test("actionInput.put with complete inputs should return the actionInput + inputs", () => {
    actionInput.put("$id", id);
    actionInput.put("$user", user);
    actionInput.put("$title", title);
    actionInput.put("$body", body);

    expect(actionInput).toBeDefined();
    expect(actionInput.get("$id")).toBe(id);
    expect(actionInput.get("$user")).toBe(user);
    expect(actionInput.get("$title")).toBe(title);
    expect(actionInput.get("$body")).toBe(body);
  });

  test("actionInput.putIfAbsent should add the missing $body input", () => {
    actionInput.putIfAbsent("$toBeDeleted", "This is a test post to be deleted.");

    expect(actionInput).toBeDefined();
    expect(actionInput.get("$id")).toBe(id);
    expect(actionInput.get("$user")).toBe(user);
    expect(actionInput.get("$title")).toBe(title);
    expect(actionInput.get("$body")).toBe(body);
    expect(actionInput.get("$toBeDeleted")).toBe("This is a test post to be deleted.");
  });

  test("actionInput.putIfAbsent should not overwrite existing inputs", () => {
    actionInput.putIfAbsent("$toBeDeleted", "This is a test post that should not be written.");

    expect(actionInput).toBeDefined();
    expect(actionInput.get("$id")).toBe(id);
    expect(actionInput.get("$user")).toBe(user);
    expect(actionInput.get("$title")).toBe(title);
    expect(actionInput.get("$body")).toBe(body);
    expect(actionInput.get("$toBeDeleted")).toBe("This is a test post to be deleted.");
  });

  test("actionInput.replace should replace a field", () => {
    actionInput.replace(
      "$toBeDeleted",
      "This is a test post that should be replaced and later deleted.",
    );

    expect(actionInput).toBeDefined();
    expect(actionInput.get("$id")).toBe(id);
    expect(actionInput.get("$user")).toBe(user);
    expect(actionInput.get("$title")).toBe(title);
    expect(actionInput.get("$body")).toBe(body);
    expect(actionInput.get("$toBeDeleted")).toBe(
      "This is a test post that should be replaced and later deleted.",
    );
  });

  test("actionInput.replace should not replace a field that does not exist", () => {
    actionInput.replace("$noExists", "This is a test post that should not be included.");

    expect(actionInput).toBeDefined();
    expect(actionInput.get("$id")).toBe(id);
    expect(actionInput.get("$user")).toBe(user);
    expect(actionInput.get("$title")).toBe(title);
    expect(actionInput.get("$body")).toBe(body);
    expect(actionInput.get("$toBeDeleted")).toBe(
      "This is a test post that should be replaced and later deleted.",
    );
    expect(actionInput.get("$noExists")).toBeUndefined();
  });

  test("actionInput.getOrDefault should return the value of an existing field", () => {
    const result = actionInput.getOrDefault("$body", "This is the default value");
    expect(result).toBe(body);
  });

  test("actionInput.getOrDefault should return the default value of a non-existing field", () => {
    const result = actionInput.getOrDefault("$noExists", "This is the default value");
    expect(result).toBe("This is the default value");
  });

  test("actionInput.containsKey should return true for a property in the actionInput", () => {
    const result = actionInput.containsKey("$id");
    expect(result).toBe(true);
  });

  test("actionInput.containsKey should return false for a property not in the actionInput", () => {
    const result = actionInput.containsKey("$noExists");
    expect(result).toBe(false);
  });

  test("actionInput.remove should remove a property from the actionInput", () => {
    actionInput.remove("$toBeDeleted");
    expect(actionInput.containsKey("$toBeDeleted")).toBe(false);
    expect(actionInput.get("$toBeDeleted")).toBeUndefined();
  });

  test("actionInput.toArray should return an array of entries", () => {
    const result = actionInput.toArray();
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(4);
    expect(result).toMatchObject([
      ["$id", id],
      ["$user", user],
      ["$title", title],
      ["$body", body],
    ]);
  });

  test("actionInput should be iterable", () => {
    let count = 0;
    for (const entry of actionInput) {
      expect(entry).toBeDefined();
      expect(entry).toBeInstanceOf(Array);
      expect(entry).toHaveLength(2);
      count++;
    }

    expect(count).toBe(4);
  });

  test("actionInput.putFromObject should add all properties from an object", () => {
    actionInput.remove("$id");
    actionInput.remove("$user");
    actionInput.remove("$title");
    actionInput.remove("$body");

    //check that actionInput is empty
    expect(actionInput.get("$id")).toBeUndefined();
    expect(actionInput.get("$user")).toBeUndefined();
    expect(actionInput.get("$title")).toBeUndefined();
    expect(actionInput.get("$body")).toBeUndefined();

    //create obj
    const obj = {
      $id: `${id} will be replaced`,
      $user: "Luke will be replaced",
      $title: "Test Post will be replaced",
    };

    actionInput.putFromObject(obj);

    expect(actionInput).toBeDefined();
    expect(actionInput.get("$id")).toBe(`${id} will be replaced`);
    expect(actionInput.get("$user")).toBe("Luke will be replaced");
    expect(actionInput.get("$title")).toBe("Test Post will be replaced");
  });

  test("actionInput.putFromObjectIfAbsent should add all properties from an object if they do not exist", () => {
    const obj = {
      $id: "This should not be entered",
      $user: "This should not be entered",
      $title: "This should not be entered",
      $body: "This is a test post will be replaced",
    };

    actionInput.putFromObjectIfAbsent(obj);

    expect(actionInput).toBeDefined();
    expect(actionInput.get("$id")).toBe(`${id} will be replaced`);
    expect(actionInput.get("$user")).toBe("Luke will be replaced");
    expect(actionInput.get("$title")).toBe("Test Post will be replaced");
    expect(actionInput.get("$body")).toBe("This is a test post will be replaced");
  });

  test("actionInput.replaceFromObject", () => {
    const obj = {
      $id: id,
      $user: user,
      $title: title,
      $body: body,
    };

    actionInput.replaceFromObject(obj);

    expect(actionInput).toBeDefined();
    expect(actionInput.get("$id")).toBe(id);
    expect(actionInput.get("$user")).toBe(user);
    expect(actionInput.get("$title")).toBe(title);
    expect(actionInput.get("$body")).toBe(body);
  });

  test("actionInput.putFromObjects should return an array of ActionInputs", () => {
    const values = [
      {
        $id: recordCount + 2,
        $user: user,
        $title: title,
        $body: body,
      },
      {
        $id: recordCount + 3,
        $user: user,
        $title: title,
        $body: body,
      },
    ];

    actionInputArr = actionInput.putFromObjects(values);

    expect(actionInputArr).toBeDefined();
    expect(actionInputArr).toBeInstanceOf(Array);
    expect(actionInputArr).toHaveLength(2);
    expect(actionInputArr[0]).toBeInstanceOf(ActionInput);
    expect(actionInputArr[0].get("$id")).toBe(recordCount + 2);
    expect(actionInputArr[0].get("$user")).toBe(user);
    expect(actionInputArr[0].get("$title")).toBe(title);
    expect(actionInputArr[0].get("$body")).toBe(body);
    expect(actionInputArr[1]).toBeInstanceOf(ActionInput);
    expect(actionInputArr[1].get("$id")).toBe(recordCount + 3);
    expect(actionInputArr[1].get("$user")).toBe(user);
    expect(actionInputArr[1].get("$title")).toBe(title);
    expect(actionInputArr[1].get("$body")).toBe(body);
  });

  let staticActionInputFrom: ActionInput;

  test("The static actionInput.from() method should accept an array of key value pairs and return an action", () => {
    staticActionInputFrom = ActionInput.from([
      ["$id", recordCount + 4],
      ["$user", user],
      ["$title", title],
      ["$body", body],
    ]);

    expect(staticActionInputFrom).toBeDefined();
    expect(staticActionInputFrom).toBeInstanceOf(ActionInput);
    expect(staticActionInputFrom.get("$id")).toBe(recordCount + 4);
    expect(staticActionInputFrom.get("$user")).toBe(user);
    expect(staticActionInputFrom.get("$title")).toBe(title);
    expect(staticActionInputFrom.get("$body")).toBe(body);
  });

  let staticActionInputFromObject: ActionInput;

  test("The static actionInput.fromObject() method should accept an object and return an action", () => {
    const obj = {
      $id: recordCount + 5,
      $user: user,
      $title: title,
      $body: body,
    };

    staticActionInputFromObject = ActionInput.fromObject(obj);

    expect(staticActionInputFromObject).toBeDefined();
    expect(staticActionInputFromObject).toBeInstanceOf(ActionInput);
    expect(staticActionInputFromObject.get("$id")).toBe(recordCount + 5);
    expect(staticActionInputFromObject.get("$user")).toBe(user);
    expect(staticActionInputFromObject.get("$title")).toBe(title);
    expect(staticActionInputFromObject.get("$body")).toBe(body);
  });

  let staticActionInputFromObjects: ActionInput[];

  test("The static actionInput.fromObjects() method should accept an array of objects and return an array of actions", () => {
    const objs = [
      {
        $id: recordCount + 6,
        $user: user,
        $title: title,
        $body: body,
      },
      {
        $id: recordCount + 7,
        $user: user,
        $title: title,
        $body: body,
      },
    ];

    staticActionInputFromObjects = ActionInput.fromObjects(objs);

    expect(staticActionInputFromObjects).toBeDefined();
    expect(staticActionInputFromObjects).toBeInstanceOf(Array);
    expect(staticActionInputFromObjects).toHaveLength(2);
    expect(staticActionInputFromObjects[0]).toBeInstanceOf(ActionInput);
    expect(staticActionInputFromObjects[0].get("$id")).toBe(recordCount + 6);
    expect(staticActionInputFromObjects[0].get("$user")).toBe(user);
    expect(staticActionInputFromObjects[0].get("$title")).toBe(title);
    expect(staticActionInputFromObjects[0].get("$body")).toBe(body);
    expect(staticActionInputFromObjects[1]).toBeInstanceOf(ActionInput);
    expect(staticActionInputFromObjects[1].get("$id")).toBe(recordCount + 7);
    expect(staticActionInputFromObjects[1].get("$user")).toBe(user);
    expect(staticActionInputFromObjects[1].get("$title")).toBe(title);
    expect(staticActionInputFromObjects[1].get("$body")).toBe(body);
  });

  test("The static actionInput.of() method should return an empty action", () => {
    const result = ActionInput.of();

    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(ActionInput);
    expect(result.get("$id")).toBeUndefined();
    expect(result.get("$user")).toBeUndefined();
    expect(result.get("$title")).toBeUndefined();
    expect(result.get("$body")).toBeUndefined();
  });

  let staticActionInputOf: ActionInput;
  test("The static actionInput.of() method should return an action with the given inputs", () => {
    staticActionInputOf = ActionInput.of()
      .put("$id", recordCount + 8)
      .put("$user", user)
      .put("$title", title)
      .put("$body", body);

    expect(staticActionInputOf).toBeDefined();
    expect(staticActionInputOf).toBeInstanceOf(ActionInput);
    expect(staticActionInputOf.get("$id")).toBe(recordCount + 8);
    expect(staticActionInputOf.get("$user")).toBe(user);
    expect(staticActionInputOf.get("$title")).toBe(title);
    expect(staticActionInputOf.get("$body")).toBe(body);
  });
});
