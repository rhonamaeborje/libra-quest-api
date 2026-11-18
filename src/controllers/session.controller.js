const { matchedData } = require('express-validator');
const sessionService = require('../services/session.service');

// What a client is allowed to see of a game.
function toJson(session) {
  return {
    code: session.join_code,
    status: session.status,
    set_id: session.set_id,
    host_id: session.user_id,
  };
}

async function create(req, res) {
  const { set_id } = matchedData(req, { locations: ['body'] });
  const session = await sessionService.create(set_id, req.user);
  res.status(201).json(toJson(session));
}

async function get(req, res) {
  const { code } = matchedData(req);
  const session = await sessionService.findOrFail(code);
  res.status(200).json(toJson(session));
}

async function changeStatus(req, res) {
  const { code } = matchedData(req, { locations: ['params'] });
  const { status } = matchedData(req, { locations: ['body'] });
  const session = await sessionService.changeStatus(code, status, req.user);
  res.status(200).json(toJson(session));
}

module.exports = { create, get, changeStatus };