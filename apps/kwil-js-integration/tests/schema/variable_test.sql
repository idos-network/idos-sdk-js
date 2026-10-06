CREATE NAMESPACE variable_test;

CREATE TABLE var_table (
    uuid_col uuid PRIMARY KEY,
    text_col text,
    int_col int,
    bool_col bool,
    dec_col numeric(5,2),
    big_dec_col numeric(20,10),
    blob_col bytea,
);

CREATE ACTION insert_all(
    $id uuid,
    $text text,
    $int int,
    $bool bool,
    $dec numeric(5,2),
    $big_dec numeric(20,10),
    $blob bytea
) PUBLIC { 
    INSERT INTO var_table (
        uuid_col,
        text_col,
        int_col,
        bool_col,
        dec_col,
        big_dec_col,
        blob_col
    ) VALUES (
        $id,
        $text,
        $int,
        $bool,
        $dec,
        $big_dec,
        $blob
    );
}

CREATE ACTION insert_uuid($id uuid) PUBLIC {
    INSERT INTO var_table(uuid_col)
    VALUES ($id);
}

CREATE ACTION insert_text($id uuid, $text text) PUBLIC {
    INSERT INTO var_table (uuid_col, text_col)
    VALUES ($id, $text);
}

CREATE ACTION insert_int($id uuid, $int int) PUBLIC {
    INSERT INTO var_table (uuid_col, int_col)
    VALUES ($id, $int);
}

CREATE ACTION insert_dec($id uuid, $dec numeric(5,2)) PUBLIC {
    INSERT INTO var_table (uuid_col, dec_col)
    VALUES ($id, $dec);
}

CREATE ACTION insert_bool($id uuid, $bool bool) PUBLIC {
    INSERT INTO var_table (uuid_col, bool_col)
    VALUES ($id, $bool);
}

CREATE ACTION insert_blob($id uuid, $blob bytea) PUBLIC {
    INSERT INTO var_table (uuid_col, blob_col)
    VALUES ($id, $blob);
}

CREATE ACTION insert_big_dec($id uuid, $big_dec numeric(20,10)) PUBLIC {
    INSERT INTO var_table (uuid_col, big_dec_col)
    VALUES ($id, $big_dec);
}