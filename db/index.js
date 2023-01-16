const { Client } = require('pg');

const client = new Client('postgres://localhost:5432/juicebox-dev');

async function getAllUsers() {
    try {
    const { rows } = await client.query(
        `SELECT id, username, name, location, active
        FROM users;
        `);
    
        return rows;
    } catch (error) {
        console.error (error);
        throw error;
    }
        
}



async function createUser({ username, password, name, location }) {
    try {
        const { rows: [ user ] }  = await client.query(`
            INSERT INTO users (username, password, name, location) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (username) DO NOTHING
            RETURNING *;
        `, [username, password, name, location]);
        return user;
    } catch (error) {
        throw error;
    }
}

async function updateUser(id, fields = {}) {

    const setString = Object.keys(fields).map(
        (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');

    if (setString.length === 0) {
        return
    }

    try {
        const { rows: [ user ] } = await client.query(`
        UPDATE users
        SET ${ setString }
        WHERE id=${ id }
        RETURNING *;
        
        
        `, Object.values(fields));

        return user;
    } catch (error) {
        throw error;
    }

}


async function createPost({
    authorId,
    title,
    content,
    tags = []
}) {
    try {

        const { rows: [ post ] }  = await client.query(`
            INSERT INTO users ("authorId", title, content) 
            VALUES ($1, $2, $3)
            ON CONFLICT (username) DO NOTHING
            RETURNING *;
        `, [authorId, title, content]);

        const tagList = await createTags(tags);
        return await addTagsToPost(post.id, tagList);

    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function updatePost(id, {
    title, 
    content,
    active
}) {

    const setString = Object.keys(fields).map(
        (key, index) => `"${ key }"=$${ index + 1}`
    ).join(', ');

    if (setString === 0) {
        return;
    }

    try {
        const { rows: [ post ] } = await client.query(`
            UPDATE posts
            SET ${ setString }
            WHERE id=${ id }
            RETURNING *;
        `, Object.values(fields));

        return post;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function getAllPosts() {
    try {

        const { rows } = await client.query(
            `SELECT *
            FROM posts;
            `);
            const posts = await Promise.all(postIds.map(
                post => getPostById( post.id )
              ));


            return posts;

    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function getPostsByUser(userId) {
    try {
      const { rows: postIds } = await client.query(`
        SELECT id 
        FROM posts 
        WHERE "authorId"=${ userId };
      `);
  
      const posts = await Promise.all(postIds.map(
        post => getPostById( post.id )
      ));
  
      return posts;
    } catch (error) {
      throw error;
    }
  }


async function getUserById(userId) {
    try {
        const { rows } = await client.query(`
            SELECT id, username, name, location, active
            FROM users
            WHERE id=${ userId };

        `);

        if (rows.length === 0 ) {
            return null;
        }

        user.posts = await getPostsByUser(userId);

    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function createPostTag(postId, tagId) {
    try {
      await client.query(`
        INSERT INTO post_tags("postId", "tagId")
        VALUES ($1, $2)
        ON CONFLICT ("postId", "tagId") DO NOTHING;
      `, [postId, tagId]);
    } catch (error) {
      throw error;
    }
  }

  async function addTagsToPost(postId, tagList) {
    try {
      const createPostTagPromises = tagList.map(
        tag => createPostTag(postId, tag.id)
      );
  
      await Promise.all(createPostTagPromises);
  
      return await getPostById(postId);
    } catch (error) {
      throw error;
    }
  }



async function getPostById(postId) {
    try {
      const { rows: [ post ]  } = await client.query(`
        SELECT *
        FROM posts
        WHERE id=$1;
      `, [postId]);
  
      const { rows: tags } = await client.query(`
        SELECT tags.*
        FROM tags
        JOIN post_tags ON tags.id=post_tags."tagId"
        WHERE post_tags."postId"=$1;
      `, [postId])
  
      const { rows: [author] } = await client.query(`
        SELECT id, username, name, location
        FROM users
        WHERE id=$1;
      `, [post.authorId])
  
      post.tags = tags;
      post.author = author;
  
      delete post.authorId;
  
      return post;
    } catch (error) {
      throw error;
    }
  }

module.exports = {
    client,
    getAllUsers,
    createUser,
    updateUser,
    getUserById,
    createPost,
    updatePost,
    getAllPosts,
    getPostsByUser,
    getPostById,
    addTagsToPost,
    createPostTag
}