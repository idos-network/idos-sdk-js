CREATE NAMESPACE mydb;

CREATE TABLE posts (
    id uuid PRIMARY KEY NOT NULL,
    name text NOT NULL,
    post_title text NOT NULL,
    post_body text NOT NULL
);

CREATE ACTION add_post($id uuid, $user text, $title text, $body text) PUBLIC {
    INSERT INTO posts (id, name, post_title, post_body) 
    VALUES ($id, $user, $title, $body);
}

CREATE ACTION update_post($body text, $id uuid) PUBLIC {
    UPDATE posts 
    SET post_body = $body 
    WHERE id = $id;
}

CREATE ACTION delete_post($id uuid) PUBLIC {
    DELETE FROM posts 
    WHERE id = $id;
}

CREATE ACTION read_posts_count() PUBLIC VIEW RETURNS (count bigint) {
    RETURN SELECT count(*) FROM posts;
}

CREATE ACTION get_post_by_id($id uuid) PUBLIC VIEW RETURNS (post_title text, post_body text) {
    RETURN SELECT post_title, post_body FROM posts WHERE id = $id;
}

CREATE ACTION view_with_param($title text) PUBLIC VIEW RETURNS TABLE (
    id uuid,
    name text,
    post_title text,
    post_body text
) {
    RETURN SELECT * FROM posts WHERE post_title = $title;
}

CREATE ACTION get_post_by_title($title text) PUBLIC VIEW RETURNS (post_title text, post_body text) {
    for $row in SELECT post_title, post_body FROM posts WHERE post_title = $title {
        RETURN $row.post_title, $row.post_body;
    }
    ERROR(format('record with title = "%s" not found', $title));
}

-- Unsure of KGW syntax and not implemented yet.
-- CREATE ACTION view_must_sign() PUBLIC VIEW @authn=true RETURNS TABLE (
--     id uuid,
--     name text,
--     post_title text,
--     post_body text
-- ) {
--     RETURN SELECT * FROM posts;
-- }

-- CREATE ACTION view_caller() PUBLIC VIEW @authn=true RETURNS (caller text) {
--     RETURN @caller;
-- }