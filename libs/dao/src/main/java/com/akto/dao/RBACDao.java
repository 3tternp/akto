package com.akto.dao;


import com.akto.dto.User;
import com.akto.dto.UserAccountEntry;
import com.akto.util.Pair;
import com.mongodb.client.model.Projections;
import io.swagger.models.auth.In;
import org.bson.conversions.Bson;

import com.akto.dao.context.Context;
import com.akto.dto.RBAC;
import com.akto.dto.RBAC.Role;
import com.mongodb.client.model.Filters;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static com.mongodb.client.model.Filters.*;
import static com.mongodb.client.model.Updates.set;

public class RBACDao extends CommonContextDao<RBAC> {
    public static final RBACDao instance = new RBACDao();

    //Caching for RBACDAO
    private static final ConcurrentHashMap<Pair<Integer, Integer>, Pair<Role, Integer>> userRolesMap = new ConcurrentHashMap<>();
    private static final int EXPIRY_TIME = 15 * 60; // 15 minute
    public void createIndicesIfAbsent() {

        boolean exists = false;
        for (String col: clients[0].getDatabase(Context.accountId.get()+"").listCollectionNames()){
            if (getCollName().equalsIgnoreCase(col)){
                exists = true;
                break;
            }
        };

        if (!exists) {
            clients[0].getDatabase(Context.accountId.get()+"").createCollection(getCollName());
        }

        String[] fieldNames = {RBAC.USER_ID, RBAC.ACCOUNT_ID};
        MCollection.createIndexIfAbsent(getDBName(), getCollName(), fieldNames, true);
    }

    public void deleteUserEntryFromCache(Pair<Integer, Integer> key) {
        userRolesMap.remove(key);
    }
    public boolean isAdmin(int userId, int accountId) {
        RBAC rbac = RBACDao.instance.findOne(
                Filters.or(Filters.and(
                                Filters.eq(RBAC.USER_ID, userId),
                                Filters.eq(RBAC.ROLE, RBAC.Role.ADMIN),
                                Filters.eq(RBAC.ACCOUNT_ID, accountId)
                        ),
                        Filters.and(
                                Filters.eq(RBAC.USER_ID, userId),
                                Filters.eq(RBAC.ROLE, RBAC.Role.ADMIN),
                                Filters.exists(RBAC.ACCOUNT_ID, false)
                                )
                )
        );
        if (rbac != null && rbac.getAccountId() == 0) {//case where account id doesn't exists belonged to older 1_000_000 account
            rbac.setAccountId(1_000_000);
        }
        return rbac != null && rbac.getAccountId() == accountId;
    }

    public static Role getCurrentRoleForUser(int userId, int accountId){
        Pair<Integer, Integer> key = new Pair<>(userId, accountId);
        Pair<Role, Integer> userRoleEntry = userRolesMap.get(key);
        Role currentRole;
        if (userRoleEntry == null || (Context.now() - userRoleEntry.getSecond() > EXPIRY_TIME)) {
            Bson filterRbac = Filters.and(
                    Filters.eq(RBAC.USER_ID, userId),
                    Filters.eq(RBAC.ACCOUNT_ID, accountId));

            RBAC userRbac = RBACDao.instance.findOne(filterRbac);
            if(userRbac != null){
                currentRole = userRbac.getRole();
            }else{
                currentRole = Role.MEMBER;
            }

            userRolesMap.put(key, new Pair<>(currentRole, Context.now()));
        } else {
            currentRole = userRoleEntry.getFirst();
        }
        return currentRole;
    }

    public List<Integer> getUserCollectionsById(int userId, int accountId) {
        RBAC rbac = RBACDao.instance.findOne(
                Filters.and(
                        eq(RBAC.ACCOUNT_ID, accountId),
                        eq(RBAC.USER_ID, userId)
                ),
                Projections.include("apiCollectionsId"));

        if(rbac == null) {
            return null;
        }

        return rbac.getApiCollectionsId();
    }

    public HashMap<Integer, List<Integer>> getAllUsersCollections(int accountId) {
        HashMap<Integer, List<Integer>> collectionList = new HashMap<>();
        List<RBAC> rbacList = RBACDao.instance.findAll(Filters.eq(RBAC.ACCOUNT_ID, accountId), Projections.include(RBAC.USER_ID, RBAC.API_COLLECTIONS_ID));

        for(RBAC rbac : rbacList) {
            int userId = rbac.getUserId();
            
            collectionList.put(userId, rbac.getApiCollectionsId());
        }

        return collectionList;
    }

    public static void updateApiCollectionAccess(int userId, int accountId, List<Integer> apiCollectionList) {
        RBACDao.instance.getMCollection()
                .updateOne(and(eq(RBAC.USER_ID, userId), eq(RBAC.ACCOUNT_ID, accountId)), set(RBAC.API_COLLECTIONS_ID, apiCollectionList));
    }

    @Override
    public String getCollName() {
        return "rbac";
    }

    @Override
    public Class<RBAC> getClassT() {
        return RBAC.class;
    }
}
