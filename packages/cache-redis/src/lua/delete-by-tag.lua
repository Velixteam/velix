-- delete-by-tag.lua
-- Supprime atomiquement toutes les clés associées à un tag Redis Set
-- KEYS[1] = tagKey (ex: "velix:tag:my-tag")
-- Retourne le nombre de clés supprimées

local keys = redis.call('SMEMBERS', KEYS[1])
if #keys > 0 then
  redis.call('DEL', unpack(keys))
end
redis.call('DEL', KEYS[1])
return #keys
