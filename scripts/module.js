const SKILLS_ID    = 'skills';
const POOLS_ID     = 'pools';
const ABILITIES_ID = 'abilities';
const COMBAT_ID    = 'combat';
const TAGS_ID      = 'tags';

const ACTION_POOL      = 'pool';
const ACTION_ABILITY   = 'ability';
const ACTION_SKILL     = 'skill';
const ACTION_ATTACK    = 'attack';
const ACTION_RECURSION = 'recursion';
const ACTION_TAG       = 'tag';

// Information from module.json
const MODULE_ID = "token-action-hud-cyphersystem"   // from module.json
const REQUIRED_CORE_MODULE_VERSION = "2.0";

/* ACTIONS */

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {

class MyActionHandler extends coreModule.api.ActionHandler {

    /** @override */
    async buildSystemActions(groupIds) {
        // We don't support MULTIPLE tokens being selected at the same time.
        //this.actors = (!this.actor) ? this._getActors() : [this.actor]
        //this.tokens = (!this.token) ? this._getTokens() : [this.token]
        //this.actorType = this.actor?.type

        const token = this.token;
        if (!token) return;
        const tokenId = token.id;
        const actor = this.actor;
        if (!actor) return;

        if (actor.type !== 'pc') {
          return;
        }
        this.#getPools    (actor, tokenId, { id: POOLS_ID,     type: 'system' })
        this.#getSkills   (actor, tokenId, { id: SKILLS_ID,    type: 'system' })
        this.#getCombat   (actor, tokenId, { id: COMBAT_ID,    type: 'system' })
        this.#getAbilities(actor, tokenId, { id: ABILITIES_ID, type: 'system' })
        this.#getTags     (actor, tokenId, { id: TAGS_ID,      type: 'system' })
      
        //if (settings.get("showHudTitle")) result.hudTitle = token.name;
    }

    #getPools(actor, tokenId, parent) {
        // three entries in this list, one per pool.
        let actions = [ "might", "speed", "intellect" ].map( key => {
            const pool = actor.system.pools[key];
            return {
                id: key,
                name: game.i18n.localize(`CYPHERSYSTEM.${key.capitalize()}`),
                encodedValue: [ACTION_POOL, actor.id, tokenId, key.capitalize()].join(this.delimiter),
                tooltip: `<p>${pool.value} / ${pool.max} (${pool.edge})</p>`
            }
        });
        /*
        // Can't roll from the ADDITIONAL POOL at the moment; but keep for later use
        if (actor.system.settings.general.additionalPool.active) {
            actions.push({
                id: 'additionalPool',
                name: actor.system.settings.general.additionalPool.label || game.i18n.localize(`CYPHERSYSTEM.AdditionalPool`),
                encodedValue: [ACTION_POOL, tokenId, "additional"].join(this.delimiter)
              });  
        }
        */
        this.addActions(actions, parent);
    }

    #getCombat(actor, tokenId, parent) {
        // just one long list of actions for the combat category
        const actions = actor.items.filter( item => item.type === 'attack' &&
            (!actor.system.settings.general.hideArchive || !item.system.archived)).map( item => { 
            return {
                id: item.id,
                name: item.name,
                encodedValue: [ACTION_ATTACK, actor.id, tokenId, item.id].join(this.delimiter),
                img: coreModule.api.Utils.getImage(item),
                tooltip: item.system.description
            }
        })
        this.addActions(actions, parent);
    }

    #createList(parent, actor, tokenId, itemtype, checksort, sorting, label, selectedfunc=undefined) {
        // create one sublist
        const actions = actor.items.filter( item => item.type === itemtype && 
            (!checksort || item.system.settings.general.sorting === sorting) &&
            (!actor.system.settings.general.hideArchive || !item.system.archived))
            .map(item => {
            return {
                id: item.id,
                name: item.name,
                encodedValue: [itemtype, actor.id, tokenId, item.id].join(this.delimiter),
                cssClass: item.system.archived ? 'disabled' : selectedfunc ? (selectedfunc(item) ? 'toggle active' : 'toggle') : '',
                img: coreModule.api.Utils.getImage(item),
                tooltip: item.system.description
            }
        })
        if (actions.length) {
            const subcat = { id: `${parent.id}-${sorting}`, name: coreModule.api.Utils.i18n(label), type: 'system-derived'};
            this.addGroup(subcat, parent);
            this.addActions(actions, subcat);
        }
    }

    #getSkills(actor, tokenId, parent) {
        // up to four groups of skills
        const table = {
            Skill:      actor.system.settings.skills.labelCategory1 || 'CYPHERSYSTEM.Skills',
            SkillTwo:   actor.system.settings.skills.labelCategory2 || 'CYPHERSYSTEM.SkillCategoryTwo',
            SkillThree: actor.system.settings.skills.labelCategory3 || 'CYPHERSYSTEM.SkillCategoryThree',
            SkillFour:  actor.system.settings.skills.labelCategory4 || 'CYPHERSYSTEM.SkillCategoryFour',
        }
        for (const [ sorting, label ] of Object.entries(table)) {
            this.#createList(parent, actor, tokenId, ACTION_SKILL, true, sorting, label)
        }
    }

    #getAbilities(actor, tokenId, parent) {
        // up to four groups of abilities
        const table = {
            Ability:      actor.system.settings.abilities.labelCategory1 || 'CYPHERSYSTEM.Abilities',
            AbilityTwo:   actor.system.settings.abilities.labelCategory2 || 'CYPHERSYSTEM.AbilityCategoryTwo',
            AbilityThree: actor.system.settings.abilities.labelCategory3 || 'CYPHERSYSTEM.AbilityCategoryThree',
            AbilityFour:  actor.system.settings.abilities.labelCategory4 || 'CYPHERSYSTEM.AbilityCategoryFour',
            Spell:        'CYPHERSYSTEM.Spells'
        }
        for (const [ sorting, label ] of Object.entries(table)) {
            this.#createList(parent, actor, tokenId, ACTION_ABILITY, true, sorting, label);
        }
    }

    #getTags(actor, tokenId, parent) {
        // current recursion is from actor.getFlag("cyphersystem", "recursion"), but the stored string is @<lowercasenanme>
        const recursion = actor.getFlag("cyphersystem", "recursion")?.slice(1); // strip leading '@'
        const recursionname = actor.items.find(item => item.name.toLowerCase() === recursion)?.name;
        this.#createList(parent, actor, tokenId, ACTION_RECURSION, false, 'recursion', 'CYPHERSYSTEM.Recursions', 
            (item) => item.name == recursionname );
        this.#createList(parent, actor, tokenId, ACTION_TAG, false, 'tag', 'CYPHERSYSTEM.Tags',
            (item) => item.system.active );
    }
} // MyActionHandler


/* ROLL HANDLER */

class MyRollHandler extends coreModule.api.RollHandler {

    async handleActionClick(event, encodedValue) {
        let payload = encodedValue.split(this.delimiter);
    
        if (payload.length != 4) {
          super.throwInvalidValueErr();
        }
    
        const [macroType, actorId, tokenId, actionId] = payload;

        const actor = coreModule.api.Utils.getActor(actorId, tokenId);
        if (this.isRenderItem()) {
            // Nothing to display for action pools
            if (macroType != ACTION_POOL) this.doRenderItem(actor, actionId)
            return;
        }
            
        switch (macroType) {
          case ACTION_POOL:
            // might-roll | speed-roll | intellect-roll
            game.cyphersystem.rollEngineMain({actorUuid: actor.uuid, pool: actionId});
            break;
          case ACTION_ATTACK:
            // item-roll
            game.cyphersystem.itemRollMacro(actor, actionId, "", "", "", "", "", "", "", "", "", "", "", "", false, "")
            break;
          case ACTION_SKILL:
            // item-roll
            game.cyphersystem.itemRollMacro(actor, actionId, "", "", "", "", "", "", "", "", "", "", "", "", false, "")
            break;
          case ACTION_ABILITY:
            // item-pay
            game.cyphersystem.itemRollMacro(actor, actionId, "", "", "", "", "", "", "", "", "", "", "", "", true, "")
            break;
          case ACTION_RECURSION:
            // transition to a recursion
            await game.cyphersystem.recursionMacro(actor, coreModule.api.Utils.getItem(actor,  actionId))
            break;
          case ACTION_TAG:
            // toggle the state of a tag
            await game.cyphersystem.tagMacro(actor, coreModule.api.Utils.getItem(actor,  actionId))
            break;
        }

        // Ensure the HUD reflects the new conditions
        Hooks.callAll('forceUpdateTokenActionHud');
    }
} // MyRollHandler


// Core Module Imports

class MySystemManager extends coreModule.api.SystemManager {
    /** @override */
    getActionHandler (categoryManager) {
        return new MyActionHandler(categoryManager)
    }

    /** @override */
    getAvailableRollHandlers () {
        const choices = { core: "Core Cypher System" };
        return choices
    }

    /** @override */
    getRollHandler (handlerId) {
        return new MyRollHandler()
    }

    /** @override */
    /*registerSettings (onChangeFunction) {
        systemSettings.register(onChangeFunction)
    }*/

    async registerDefaults () {

        const SKILLS_NAME    = game.i18n.localize('CYPHERSYSTEM.Skills');
        const ABILITIES_NAME = game.i18n.localize('CYPHERSYSTEM.Abilities');
        const POOLS_NAME     = game.i18n.localize('CYPHERSYSTEM.Pool');
        const COMBAT_NAME    = game.i18n.localize('CYPHERSYSTEM.Combat');
        const TAGS_NAME      = '@'; //game.i18n.localize('CYPHERSYSTEM.Tags');
        
        const DEFAULTS = {
            layout: [
                {
                    nestId: POOLS_ID + "-title",
                    id:     POOLS_ID + "-title",
                    name:   POOLS_NAME,
                    type:   'system',
                    groups: [
                        {
                            nestId: 'pools-title_pools',
                            id:     POOLS_ID,
                            name:   POOLS_NAME,
                            type:   'system'
                        }
                    ]
                },
                {
                    nestId: SKILLS_ID + "-title",
                    id:     SKILLS_ID + "-title",
                    name:   SKILLS_NAME,
                    type:   'system',
                    groups: [
                        {
                            nestId: 'skills-title_skills',
                            id:     SKILLS_ID,
                            name:   SKILLS_NAME,
                            type:   'system'
                        }
                    ]
                },
                {
                    nestId: COMBAT_ID + "-title",
                    id:     COMBAT_ID + "-title",
                    name:   COMBAT_NAME,
                    type:   'system',
                    groups: [
                        {
                            nestId: 'combat-title_combat',
                            id:     COMBAT_ID,
                            name:   COMBAT_NAME,
                            type: 'system'
                        }
                    ]
                },
                {
                    nestId: ABILITIES_ID + "-title",
                    id:     ABILITIES_ID + "-title",
                    name:   ABILITIES_NAME,
                    type:   'system',
                    groups: [
                        {
                            nestId: 'abilities-title_abilities',
                            id:     ABILITIES_ID,
                            name:   ABILITIES_NAME,
                            type:   'system'
                        }
                    ]
                },
                {
                    nestId: TAGS_ID + "-title",
                    id:     TAGS_ID + "-title",
                    name:   TAGS_NAME,
                    type:   'system',
                    groups: [
                        {
                            nestId: 'tags-title_tags',
                            id:     TAGS_ID,
                            name:   TAGS_NAME,
                            type:   'system'
                        }
                    ]
                },
            ],
            groups: [
                { id: ABILITIES_ID, name: ABILITIES_NAME, type: 'system' },
                { id: COMBAT_ID,    name: COMBAT_NAME,    type: 'system' },
                { id: POOLS_ID,     name: POOLS_NAME,     type: 'system' },
                { id: SKILLS_ID,    name: SKILLS_NAME,    type: 'system' },
                { id: TAGS_ID,      name: TAGS_NAME,      type: 'system' }
            ]
        }

        // HUD CORE v1.2 wants us to return the DEFAULTS
        return DEFAULTS;
    }
} // MySystemManager

/* STARTING POINT */

    const module = game.modules.get(MODULE_ID);
    module.api = {
        requiredCoreModuleVersion: REQUIRED_CORE_MODULE_VERSION,
        SystemManager : MySystemManager
    }    
    Hooks.call('tokenActionHudSystemReady', module)
});
