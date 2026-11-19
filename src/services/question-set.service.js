const fs = require('fs/promises');
const path = require('path');
const questionSetRepository = require('../repositories/question-set.repository');
const { toOffset } = require('../utils/paginate');
const { notFound, forbidden } = require('../errors/app-error');

const COVER_DIR = path.join(__dirname, '..', '..', 'uploads', 'covers');

async function findOrFail(id, options) {
  const questionSet = await questionSetRepository.findById(id, options);
  if (!questionSet) {
    throw notFound('QUESTION_SET_NOT_FOUND', `No question set has the id ${id}.`);
  }
  return questionSet;
}

function isOwner(questionSet, user) {
  return questionSet.user_id === user.user_id || user.role === 'ADMIN';
}

function removeCoverFile(filename) {
  if (!filename) return Promise.resolve();
  return fs.unlink(path.join(COVER_DIR, path.basename(filename))).catch(() => {});
}

// Rule: a host sees their own sets. An admin sees every set.
async function list(user, { page = 1, limit = 10, sort = 'set_id', order = 'asc', q } = {}) {
  const { limit: take, offset } = toOffset({ page, limit });
  const { rows, count } = await questionSetRepository.findPage({
    hostId: user.role === 'ADMIN' ? null : user.user_id,
    q,
    sort,
    order,
    limit: take,
    offset,
  });
  return { rows, total: count };
}

// Rule: only the owner (or an admin) may read a set.
async function get(id, user, { withQuestions = false } = {}) {
  const questionSet = await findOrFail(id, { withQuestions });
  if (!isOwner(questionSet, user)) {
    throw forbidden('This question set belongs to another host.');
  }
  return questionSet;
}

// Rule: the owner is the caller. A client can never choose user_id.
function create(data, user) {
  return questionSetRepository.create({ ...data, user_id: user.user_id });
}

// Rule: only the owner (or an admin) may change a set.
async function update(id, changes, user) {
  const questionSet = await findOrFail(id);
  if (!isOwner(questionSet, user)) {
    throw forbidden('This question set belongs to another host.');
  }
  return questionSetRepository.update(questionSet, changes);
}

// Rule: only the owner (or an admin) may delete a set.
async function remove(id, user) {
  const questionSet = await findOrFail(id);
  if (!isOwner(questionSet, user)) {
    throw forbidden('This question set belongs to another host.');
  }
  await questionSetRepository.remove(questionSet);
  await removeCoverFile(questionSet.picture && path.basename(questionSet.picture));
}

// Rule: only the owner may upload a cover. multer has already saved the file,
// so a refused request must delete it again (no orphan files on the disk).
async function uploadCover(id, file, user) {
  try {
    const questionSet = await findOrFail(id);
    if (!isOwner(questionSet, user)) {
      throw forbidden('This question set belongs to another host.');
    }
    const oldFile = questionSet.picture && path.basename(questionSet.picture);
    const updated = await questionSetRepository.update(questionSet, {
      picture: `/uploads/covers/${file.filename}`,
    });
    await removeCoverFile(oldFile);
    return updated;
  } catch (error) {
    await removeCoverFile(file.filename);
    throw error;
  }
}

module.exports = { list, get, create, update, remove, uploadCover };