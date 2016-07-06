<?php

namespace ProcessManager\CallbackSetting\Listing;

use ProcessManager\Plugin;
use Pimcore\Model;

class Dao extends Model\Listing\Dao\AbstractDao {

    protected function getTableName(){
        return Plugin::TABLE_NAME_CALLBACK_SETTING;
    }

    public function load() {
        $sql = "SELECT id FROM " . $this->getTableName() . $this->getCondition() . $this->getOrder() . $this->getOffsetLimit();
        $ids = $this->db->fetchCol($sql,  $this->model->getConditionVariables());

        $items = [];
        foreach ($ids as $id) {
            $items[] = \ProcessManager\CallbackSetting::getById($id);
        }
        return $items;
    }

    public function getTotalCount() {
        return (int) $this->db->fetchOne("SELECT COUNT(*) as amount FROM " . $this->getTableName() . " ". $this->getCondition(), $this->model->getConditionVariables());
    }
}