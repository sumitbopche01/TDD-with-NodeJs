# Test-Driven-Development for building APIs in Node.js and Express
Test-Driven-Development ([TDD](https://en.wikipedia.org/wiki/Test-driven_development)) is an increasingly popular, and practical, development methodology in today’s software industry, and it is easy to apply in [Node.js](https://nodejs.org) – as we’ll see in this article. TDD forces much greater code test coverage, and if you aren’t already using it, I’d strongly encourage trying.

The process is: define a test that expects the output we want from our library, API, or whatever it is we’re testing to produce; ensure that the test fails – because we have not yet implemented any functionality; then write the implementation code required to make that test pass.<span id="more-419650"></span>

Modern languages and testing frameworks make this easy to achieve, and we’ve evolved to the point in technology where we can write concise, easily maintainable tests before even thinking about writing implementation code.

Node.js is quickly becoming a language of choice for REST API development, and [Express](http://expressjs.com/) has established itself as an almost de-facto standard web framework of choice. It allows us to build a RESTful web page capable of serving both HTML content and an API, along with much more besides.

One of the most important first steps when building an Express project is to test the APIs you create, and ensure they return what you expect.

## First Steps

For today’s tutorial, we’ll assume Node.js is [already installed](https://www.google.com/search?q=install+node+js&oq=install+node+js&aqs=chrome..69i57j0l5.2086j0j4&sourceid=chrome&es_sm=91&ie=UTF-8#q=how+to+install+node+js) in your development environment, and that you are familiar with and have installed the [Git version control system](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git). We’re going to start with a simple Express application that serves up an API for addition and subtraction (who doesn’t love a calculator?). Run the following commands in a terminal window to download the example application:

<pre>git clone https://github.com/cianclarke/tdd-for-apis.git ; cd tdd-for-apis # Clone the finished repository
git checkout boilerplate # jump to the initial project code
</pre>

Next, we’re going to install the testing frameworks we’ll use as _dev-dependencies_, meaning they won’t get installed when we run `npm install` in a production environment, but we still need them during development in order to do our work. Run the following commands to set up our test framework:

<pre>npm install --save-dev supertest
npm install --save-dev mocha
</pre>

Now that we have our testing framework set up, we’re going to create our first test – an integration test for our “addition” route. (For reference, each Express.js “route” is a definition of an application end point (URI) and how it should respond to client requests.)

## Create integration tests

The purpose of integration tests in this application will be to verify the API footprint our application exposes, but no more. We’re not going to be testing the functionality that these routes implement – just that the API itself returns appropriate bodies and status codes for all the scenarios we’ve handled.

First, let’s create a directory to store our tests in, and a blank file which will contain our first test. Make sure you are currently within the project root directory, then run the following commands:

<pre>mkdir -p test/integration
touch test/integration/test-route-addition.js
</pre>

_(You’ll notice I’ve given my new file two prefixes – one to mark that it’s a test, and another to mark it tests a route. This is personal preference – we could just call this file `users.js`, but my preference is to clearly differentiate tests from other files.)_

Second, let’s actually write the integration test – this is where we’ll define the expected behavior of our API end point. We’ll expect our route to be mounted at `/add`, and that it will take two query string params called `a` and `b`.

With these parameters present, we’ll expect to receive a `200 (OK)` status code, and if one or more of these values is missing or is set to a non-integer value, we’ll expect to receive a `422 un-processable entity` status code when we call the API. This is what our test should look like:

<pre>var supertest = require('supertest'),
app = require('../../app');

exports.addition_should_accept_numbers = function(done){
  supertest(app)
  .get('/add?a=1&b=1')
  .expect(200)
  .end(done);
};

exports.addition_should_reject_strings = function(done){
  supertest(app)
  .get('/add?a=string&b=2')
  .expect(422)
  .end(done);
};
</pre>

Let’s now add another test, verifying that our subtraction route also serves up the API we expect. This test will run in parallel to the addition tests, saving time when we go to run our full suite. Run the following command to create a new file for our ‘subtraction’ test case:

<pre>touch test/integration/test-route-subtraction.js
</pre>

In this test, we’re going to verify that the response body contains a specific property, which is another crucial to verify that our API performs as expected, since a `200 (OK)` status code doesn’t guarantee that the API is actually doing what we want! Our new test should look like this:

<pre>var supertest = require('supertest'),
assert = require('assert'),
app = require('../../app');

exports.addition_should_respond_with_a_numeric_result = function(done){
  supertest(app)
  .get('/subtract?a=5&b=4')
  .expect(200)
  .end(function(err, response){
    assert.ok(!err);
    assert.ok(typeof response.body.result === 'number');
    return done();
  });
};
</pre>

## Run the integration tests

In the example code you downloaded, I’ve already created stubs our `/add` and `/subtract` routes and mounted them in the [`app.js`](https://github.com/cianclarke/tdd-for-apis/blob/744a477e32ac3abc0c49dd983d70ed02173f688d/app.js) file. The files defining these routes can be found in the `/routes` directory, or in the demo repository [on GitHub](https://github.com/cianclarke/tdd-for-apis/tree/744a477e32ac3abc0c49dd983d70ed02173f688d/routes).

Even though these routes don’t do more than return a `200 (OK)` status code, having stubs allows our test runner to fail gracefully. This gives us a starting point for implementing the functionality – create a failing test, then implement.

It’s time to run (and fail) the test, which you can do by executing the following command:

<pre>node_modules/.bin/mocha -u exports test/integration/*

 You can see all the changes for this step, including what npm does when we run `install --save-dev` [on GitHub.](https://github.com/cianclarke/tdd-for-apis/commit/744a477e32ac3abc0c49dd983d70ed02173f688d)</pre>

## Make the integration tests pass

Now that we’ve implemented some failing tests (the “T” in TDD), it’s time to “D”, develop!

We’re going to implement our two routes, `/addition` and `/subtraction`, which accept only numbers, and return a numeric result.

Since we want to use good programming practices and separate our concerns, let’s create some empty libraries for handling these mathematic operations. We’re going to make a `lib` directory, with two files – `add.js` and `subtract.js`, both of which export functions that return `0` – this works since we don’t currently test for result correctness, just for a result. Run the following commands:

<pre>mkdir lib
echo "module.exports = function(){ return 0; };" > lib/add.js
echo "module.exports = function(){ return 0; };" > lib/subtract.js
</pre>

Now, let’s set up our route handlers to use these `add` and `subtract` functions. Here’s our add route, in `routes/add.js`. Yours should look like this:

<pre>var add = require('../lib/add');
module.exports = function(req, res, next){
  return res.json({ result : add(req.a, req.b) });
};
</pre>

(Would it surprise you to learn subtract looked pretty similar?!:-) I trust you to update `routes/subtract.js` appropriately. Go ahead and do that now.)

Lastly, we discussed only allowing numbers into these functions – but we’d rather not repeat this logic in both our route handlers, so let’s add some input-checks before these two functions run. For simplicity sake, we’re just going to put this in our `app.js` file, but I often create a separate [middleware](http://expressjs.com/en/guide/using-middleware.html) directory alongside `lib` and `routes`. Update `app.js` to include our new middleware:

<pre>app.use(function(req, res, next){
  var a = parseInt(req.query.a),
  b = parseInt(req.query.b);
  if (!a || !b || isNaN(a) || isNaN(b)){
    return res.status(422).end("You must specify two numbers as query params, A and B");
  }
  req.a = a;
  req.b = b;
  return next();
});
</pre>

Now when we try running our integration tests, we should see they pass just fine! Our output will look like this:

[![TDD for APIs 1](https://rhdevelopers.files.wordpress.com/2016/03/screenshot-2016-03-08-13-37-53.png?w=960)](https://rhdevelopers.files.wordpress.com/2016/03/screenshot-2016-03-08-13-37-53.png)

You can see the full code for this step [on GitHub.](https://github.com/cianclarke/tdd-for-apis/commit/7680bb4987cc60eeb9651bc3655b45d15f02bb50)

## Add unit tests

Now that we’ve added integration tests to verify our API does what we’d expect, let’s add some unit tests to verify that our addition and subtraction logic fails (remember we don’t currently return correct results). Sounds strange, doesn’t it? Remember – TDD means write failing tests, implement, observe passing tests!

First, we’ll create a place for our tests to live, and create blank files for our addition and subtraction tests. We should be good at this now, but run the following commands to create our new test files:

<pre>mkdir test/unit
touch test/unit/test-lib-addition.js ; touch test/unit/test-lib-subtraction.js;
</pre>

Our addition test will look like this. Update `test-lib-addition.js` accordingly:

<pre>var assert = require('assert'),
add = require('../../lib/add');

exports.it_should_add_two_numbers = function(done){
  var result = add(1,1);
  assert.ok(result === 2);
  return done();
};

exports.it_should_add_two_negative_numbers = function(done){
  var result = add(-2,-2);
  assert.ok(result === -4);
  return done();
};
</pre>

We’ve also added a subtraction test – you can probably guess what it looks like! Update that one as well, and if you’d rather not re-implement subtraction, you can see the changes [on GitHub.](https://github.com/cianclarke/tdd-for-apis/commit/8436053564bb43e529c2f508db9abc546c6b758d)

When we run our unit tests, they fail – as we’d expect, since right now our libraries just return the number zero. This means we’re doing our jobs well!

[![TDD APis failing unit tests](https://rhdevelopers.files.wordpress.com/2016/03/screenshot-2016-03-08-13-45-38.png?w=640)](https://rhdevelopers.files.wordpress.com/2016/03/screenshot-2016-03-08-13-45-38.png)

At this point, I’m going to make a brash assumption: If you have an apetite for learning about TDD, and have gotten this far in the tutorial, you probably don’t need me to show you the implementation of our [addition and subtraction functions.](https://github.com/cianclarke/tdd-for-apis/commit/503b54554692108ca1fd457e2e5581cd1dcc9817) Sound fair? Go ahead and update those and, now, when we run the test runner our unit tests pass just fine. Congratulations!

## Tell users how to run our tests

There’s a great convention in Node.js applications of being able to run tests by simply running `npm test`. Since conventions are there to make our project easier to understand, let’s be good citizens and set up our project to enable this. Add an entry to our `package.json` file, like so:

<pre>  "scripts" : {
    "test" : "node_modules/.bin/mocha -u exports test/**/*"
  }
</pre>

Now we can run our tests with `npm test`, rather than this long command. Notice we specify our tests in the `test/**/*` directory – meaning any file in a subdirectory of `test` will be run as a Mocha test.

Run `npm test` and our output now shows the result of running 7 tests. Fantastic!

## Conclusion

Now that you’ve seen TDD in action, hopefully you can make use of these methods in your own development. Start small – green field projects make it easier to practice TDD from the start, and it can be sometimes difficult to retro-fit the process to a monolith.

There’s also a lot we can do to expand today’s tests. A great first step would be introducing a task runner to allow us to split our tests up into groups – it’s always helpful to be able to run tests in isolation, to more quickly run only the tests that we are interested in.

Even if you don’t practice TDD religiously, try to at least write tests which cover all the functionality of your application, and the entire API footprint it exposes, but… measuring test coverage is an exercise for another article! ;-)

Happy testing!
